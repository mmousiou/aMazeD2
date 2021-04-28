##############################
# Definitions
##############################

USER_APPS = {index,maze,turtle}
ALL_JSON = {./,index,maze,turtle}
ALL_TEMPLATES = appengine/template.soy,appengine/index/template.soy,appengine/maze/template.soy,appengine/turtle/template.soy

APP_ENGINE_THIRD_PARTY = appengine/third-party
SOY_COMPILER = java -jar third-party-downloads/SoyToJsSrcCompiler.jar --shouldProvideRequireSoyNamespaces --isUsingIjData
SOY_EXTRACTOR = java -jar third-party-downloads/SoyMsgExtractor.jar

REQUIRED_BINS = svn unzip wget java python sed

##############################
# Rules
##############################

all: deps languages

index-en:
	mkdir -p appengine/generated/en/
	$(SOY_COMPILER) --outputPathFormat appengine/index/generated/en/soy.js --srcs appengine/index/template.soy
	python build-app.py index en


maze-en: common-en
	$(SOY_COMPILER) --outputPathFormat appengine/maze/generated/en/soy.js --srcs appengine/maze/template.soy
	python build-app.py maze en

turtle-en: common-en
	$(SOY_COMPILER) --outputPathFormat appengine/turtle/generated/en/soy.js --srcs appengine/turtle/template.soy
	python build-app.py turtle en


common-en:
	$(SOY_COMPILER) --outputPathFormat appengine/generated/en/soy.js --srcs appengine/template.soy

en: index-en maze-en turtle-en

index  maze turtle : common
	@echo "Generating JS from appengine/$@/template.soy"
	mkdir -p appengine/$@/generated;
	i18n/json_to_js.py --output_dir appengine/$@/generated --template appengine/$@/template.soy json/*.json;
	python build-app.py $@
	@echo


common: soy-to-json
	@echo "Generating JS from appengine/template.soy"
	mkdir -p appengine/generated;
	i18n/json_to_js.py --output_dir appengine/generated --template appengine/template.soy json/*.json;
	@echo

soy-to-json:
	@echo "Converting Soy files to JSON for Translatewiki."
	@# Create extracted_msgs.xlf with all messages from all soy files.
	$(SOY_EXTRACTOR) --outputFile extracted_msgs.xlf --srcs $(ALL_TEMPLATES)
	@# Creates json/en.json, json/qqq.json, json/keys.json.
	@# Deletes extracted_msgs.xlf
	i18n/xliff_to_json.py --xlf extracted_msgs.xlf --templates $(ALL_TEMPLATES)
	@echo

languages: soy-to-json
	@for app in $(ALL_JSON); do \
	  echo "Generating JS from appengine/$$app/template.soy"; \
	  mkdir -p appengine/$$app/generated; \
	  i18n/json_to_js.py --output_dir appengine/$$app/generated --template appengine/$$app/template.soy json/*.json; \
	  echo; \
	done
	@for app in $(USER_APPS); do \
	  python build-app.py $$app; \
	done

deps:
	$(foreach bin,$(REQUIRED_BINS),\
	    $(if $(shell command -v $(bin) 2> /dev/null),$(info Found `$(bin)`),$(error Please install `$(bin)`)))
	mkdir -p third-party-downloads
	@# All following commands are in third-party-downloads, use backslashes to keep them on the same line as the cd command.
	cd third-party-downloads; \
	svn checkout https://github.com/google/closure-library/trunk/closure/bin/build build; \
	wget -N https://dl.google.com/closure-templates/closure-templates-for-javascript-latest.zip; \
	unzip -o closure-templates-for-javascript-latest.zip SoyToJsSrcCompiler.jar; \
	wget -N https://dl.google.com/closure-templates/closure-templates-msg-extractor-latest.zip; \
	unzip -o closure-templates-msg-extractor-latest.zip SoyMsgExtractor.jar; \
	wget -N https://unpkg.com/google-closure-compiler-java/compiler.jar; \
	mv -f compiler.jar closure-compiler.jar; \
	chmod +x build/closurebuilder.py

	mkdir -p $(APP_ENGINE_THIRD_PARTY)
	wget -N https://unpkg.com/@babel/standalone@7.6.4/babel.min.js
	mv babel.min.js $(APP_ENGINE_THIRD_PARTY)/
	svn checkout --force https://github.com/ajaxorg/ace-builds/trunk/src-min-noconflict/ $(APP_ENGINE_THIRD_PARTY)/ace
	mkdir -p $(APP_ENGINE_THIRD_PARTY)/blockly
	svn checkout https://github.com/google/blockly/trunk/blocks/ $(APP_ENGINE_THIRD_PARTY)/blockly/blocks
	svn checkout https://github.com/google/blockly/trunk/core/ $(APP_ENGINE_THIRD_PARTY)/blockly/core
	svn checkout https://github.com/google/blockly/trunk/externs/ $(APP_ENGINE_THIRD_PARTY)/blockly/externs
	svn checkout https://github.com/google/blockly/trunk/generators/ $(APP_ENGINE_THIRD_PARTY)/blockly/generators
	svn checkout https://github.com/google/blockly/trunk/media/ $(APP_ENGINE_THIRD_PARTY)/blockly/media
	svn checkout https://github.com/google/blockly/trunk/msg/ $(APP_ENGINE_THIRD_PARTY)/blockly/msg
	svn checkout https://github.com/CreateJS/SoundJS/trunk/lib/ $(APP_ENGINE_THIRD_PARTY)/SoundJS
	cp third-party/base.js $(APP_ENGINE_THIRD_PARTY)/
	cp third-party/soyutils.js $(APP_ENGINE_THIRD_PARTY)/
	cp -R third-party/soundfonts $(APP_ENGINE_THIRD_PARTY)/

	@# Blockly's externs include extra files we don't want.
	rm -f $(APP_ENGINE_THIRD_PARTY)/blockly/externs/block-externs.js
	rm -f $(APP_ENGINE_THIRD_PARTY)/blockly/externs/generator-externs.js

	@# Blockly's date field needs Closure.  But we don't use it.
	rm -f $(APP_ENGINE_THIRD_PARTY)/blockly/core/field_date.js

	svn checkout https://github.com/NeilFraser/JS-Interpreter/trunk/ $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter
	@# Remove @license tag so compiler will strip Google's license.
	sed 's/@license//' $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter/interpreter.js > $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter/interpreter_.js
	@# Compile JS-Interpreter using SIMPLE_OPTIMIZATIONS because the Music game needs to mess with the stack.
	java -jar third-party-downloads/closure-compiler.jar\
	 --language_out ECMASCRIPT5_STRICT\
	 --js $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter/acorn.js\
	 --js $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter/interpreter_.js\
	 --js_output_file $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter/compressed.js
	rm $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter/interpreter_.js

clean: clean-languages clean-deps

clean-languages:
	rm -rf appengine/$(ALL_JSON)/generated
	rm -f json/keys.json

clean-deps:
	rm -rf $(APP_ENGINE_THIRD_PARTY)
	rm -rf third-party-downloads

# Prevent non-traditional rules from exiting with no changes.
.PHONY: deps
