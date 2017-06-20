var fs = require('fs');
module.exports = function(app) {
  app.config([
    'formioComponentsProvider',
    function(formioComponentsProvider) {
      formioComponentsProvider.register('textarea', {
        title: 'Text Area',
        template: function($scope) {
          if (!$scope.readOnly && $scope.component.wysiwyg) {
            var defaults = {
              toolbarGroups:  [
                {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
                {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']},
                {name: 'links', groups: ['links']},
                {name: 'insert', groups: ['insert']},
                '/',
                {name: 'styles', groups: ['Styles', 'Format', 'Font', 'FontSize']},
                {name: 'colors', groups: ['colors']},
                {name: 'clipboard', groups: ['clipboard', 'undo']},
                {name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing']},
                {name: 'document', groups: ['mode', 'document', 'doctools']},
                {name: 'others', groups: ['others']},
                {name: 'tools', groups: ['tools']}
              ],
              extraPlugins: 'justify,font',
              removeButtons: 'Cut,Copy,Paste,Underline,Subscript,Superscript,Scayt,About',
              uiColor: '#eeeeee',
              height: '400px',
              width: '100%'
            };
            if ($scope.component.wysiwyg === true) {
              $scope.component.wysiwyg = defaults;
            }
            else {
              $scope.component.wysiwyg = angular.extend(defaults, $scope.component.wysiwyg);
            }
            return 'formio/components/texteditor.html';
          }
          else if (!$scope.readOnly && $scope.component.components) {
            $scope.aceOptions = {
              useWrapMode: true,
              showGutter: true,
              theme: 'dawn',
              mode: 'javascript',
              showIndentGuides: true,
              showPrintMargin: false,
              onLoad: function(editor) {
                // Disable message: 'Automatically scrolling cursor into view after selection change this will be disabled in the next version set editor.$blockScrolling = Infinity to disable this message'
                editor.$blockScrolling = Infinity;
                editor.setOptions({enableBasicAutocompletion: true});
                /* eslint-disable no-undef*/
                var tools = ace.require('ace/ext/language_tools');
                /* eslint-enable  no-undef*/
                if (tools.completed !== true) {
                    tools.completed   = true;
                    tools.addCompleter({
                      getCompletions: function(editor, session, pos, prefix, callback) {
                        callback(null, _.map($scope.component.components, function(comp) {
                          return {name: comp.key, value: comp.key, score: 1000, meta: 'component'};
                        }));
                      }
                    });
                }
              }
            };
            return 'formio/components/textaceeditor.html';
          }
          return 'formio/components/textarea.html';
        },
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'textareaField',
          placeholder: '',
          prefix: '',
          suffix: '',
          rows: 3,
          multiple: false,
          defaultValue: '',
          protected: false,
          persistent: true,
          hidden: false,
          wysiwyg: false,
          clearOnHide: true,
          validate: {
            required: false,
            minLength: '',
            maxLength: '',
            pattern: '',
            custom: ''
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/textarea.html', FormioUtils.fieldWrap(
        fs.readFileSync(__dirname + '/../templates/components/textarea.html', 'utf8')
      ));
      $templateCache.put('formio/components/texteditor.html', FormioUtils.fieldWrap(
        fs.readFileSync(__dirname + '/../templates/components/texteditor.html', 'utf8')
      ));
      $templateCache.put('formio/components/textaceeditor.html', FormioUtils.fieldWrap(
        fs.readFileSync(__dirname + '/../templates/components/textaceeditor.html', 'utf8')
      ));
    }
  ]);
};
