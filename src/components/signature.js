var fs = require('fs');
var sw = require('sig-web-tablet');
var SignaturePad = require('signature_pad');
module.exports = function(app) {
  app.config([
    'formioComponentsProvider',
    function(formioComponentsProvider) {
      formioComponentsProvider.register('signature', {
        title: 'Signature',
        template: 'formio/components/signature.html',
        tableView: function(data) {
          return data ? 'Yes' : 'No';
        },
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          label: 'Signature',
          key: 'signature',
          placeholder: '',
          footer: 'Sign above',
          width: '100%',
          height: '150',
          penColor: 'black',
          backgroundColor: 'rgba(255,255,255,0)',
          minWidth: '0.5',
          maxWidth: '2.5',
          protected: false,
          persistent: true,
          hidden: false,
          zoom: false,
          clearOnHide: true,
          validate: {
            required: false
          }
        },
        viewTemplate: 'formio/componentsView/signature.html'
      });
    }
  ]);
  app.controller('formioSignatureComponent', [
    '$scope',
    function($scope) {
      $scope.$on('clearComponent', function() {
        $scope.component.clearSignature();
      });
    }
  ]);
  app.directive('signature', ['ngDialog', function(ngDialog) {
    return {
      restrict: 'A',
      scope: {
        component: '='
      },
      require: '?ngModel',
      link: function(scope, element, attrs, ngModel) {
        if (scope.options && scope.options.building) return;
        if (!ngModel) {
          return;
        }

        // Sets the label of component for error display.
        scope.component.label = 'Signature';
        scope.component.hideLabel = true;

        // Sets the dimension of a width or height.
        var setDimension = function(dim) {
          var param = dim === 'width' ? 'clientWidth' : 'clientHeight';
          element[0][dim] = element.parent().eq(0)[0][param];
          return;

          var param = (dim === 'width') ? 'clientWidth' : 'clientHeight';
          if (scope.component[dim].slice(-1) === '%') {
            var percent = parseFloat(scope.component[dim].slice(0, -1)) / 100;
            element[0][dim] = element.parent().eq(0)[0][param] * percent;
          }
          else {
            element[0][dim] = parseInt(scope.component[dim], 10);
            scope.component[dim] = element[0][dim] + 'px';
          }
        };

        // Create the signature pad.
        var signaturePad = new SignaturePad(element[0], {
          minWidth: scope.component.minWidth,
          maxWidth: scope.component.maxWidth,
          penColor: scope.component.penColor,
          backgroundColor: scope.component.backgroundColor
        });

        scope.$watch('component.penColor', function(newValue) {
          signaturePad.penColor = newValue;
        });

        scope.$watch('component.backgroundColor', function(newValue) {
          signaturePad.backgroundColor = newValue;
          signaturePad.clear();
        });

        // Set the width and height of the canvas.
        // Reset size if element changes visibility.
        // Use setTimeout so parent DIV client width and height are meaningful
        scope.$watch('component.display', function() {
          setTimeout(function() {
            setDimension('width');
            setDimension('height');
            signaturePad.backgroundColor = scope.component.backgroundColor;
            signaturePad.clear();
            signaturePad.fromDataURL(ngModel.$viewValue);
          });
        });

        var timer;

        // Is Topaz device installed?
        try {
          sw.clearTablet();
          scope.$parent.hasTablet = true;
        }
        catch (e) {
          scope.$parent.hasTablet = false;
        }

        // Start recording the signature using Topaz device.
        scope.component.recordSignature = function() {
          var canvas  = element[0];
          var context = canvas.getContext('2d');

          signaturePad.clear();
          sw.setDisplayXSize(canvas.width);
          sw.setDisplayYSize(canvas.height);
          sw.setTabletState(0, timer);
          sw.setJustifyMode(0);
          sw.clearTablet();
          if (timer == null) {
            timer = sw.setTabletState(1, context, 50);
          }
          else {
            sw.setTabletState(0, timer);
            timer = null;
            timer = sw.setTabletState(1, context, 50);
          }
        };

        // Stop recording the signature using Topaz device.
        scope.component.stopSignature = function() {
          if (sw.numberOfTabletPoints() === 0) {
            alert('Please sign before continuing');
          }
          else {
            var canvas  = element[0];

            sw.setTabletState(0, timer);
            sw.setImageXSize(canvas.width);
            sw.setImageYSize(canvas.height);
            sw.setImagePenWidth(5);
            sw.getSigImageB64(function(data) {
              var dataUrl = 'data:image/png;base64,' + data;
              ngModel.$setViewValue(dataUrl);
            });
          }
        };

        // Clear the signature.
        scope.component.clearSignature = function() {
          signaturePad.clear();
          readSignature();
          if (scope.$parent.hasTablet) {
            sw.clearTablet();
          }
        };

        // Pop up dialog for signing in small spaces
        scope.component.zoomIn = function($event) {
          if (!scope.component.zoom) {
            return;
          }

          $event.preventDefault();
          $event.target.blur(); 

          var template  = '<br>' +
                          '<div class="row">' +
                            '<div class="col-sm-12">' +
                              '<div class="panel panel-default">' +
                                '<div class="panel-heading">' +
                                  '<h3 class="panel-title">{{ "Signature" | formioTranslate}}</h3>' +
                                '</div>' +
                                '<div class="panel-body">' +
                                  '<formio src="src" submission="sub"></formio>' +
                                '</div>' +
                              '</div>' +
                            '</div>' +
                          '</div>';

          ngDialog.open({
            template: template,
            plain: true,
            scope: scope,
            controller: ['$scope', 'Formio', function($scope, Formio) {
              $scope.src = scope.src = Formio.getApiUrl() + '/zoomsignature';
              $scope.sub = scope.sub = {data: {signature: signaturePad.toDataURL()}};

              $scope.$on('formLoad', function(event, form) {
                event.stopPropagation(); // Don't confuse app
                var dialogWidth   = 0.65;
                var dialogPadding = 16.5;
                var panelPadding  = 15.0;

                // Calculate signature width and height to maintain their ratio
                form.components[0].width  = window.innerWidth * dialogWidth - 2 * dialogPadding - 2 * panelPadding;
                form.components[0].height = form.components[0].width * element[0].height / element[0].width;

                // Copy other signature settings
                form.components[0].footer          = scope.component.footer;
                form.components[0].tooltip         = scope.component.tooltip;
                form.components[0].backgroundColor = scope.component.backgroundColor;
                form.components[0].penColor        = scope.component.penColor;
                form.components[0].customClass     = scope.component.customClass;
              });

              $scope.$on('save', function() {
                $scope.closeThisDialog(true);
              });

              $scope.$on('cancel', function() {
                $scope.closeThisDialog(false);
              });
            }]
          }).closePromise.then(function(e) {
            if (e.value === true) {
              signaturePad.clear();
              signaturePad.fromDataURL(scope.sub.data.signature);
              ngModel.$setViewValue(scope.sub.data.signature);
            }
          });
        };

        // Set some CSS properties.
        element.css({
          'border-radius': '4px',
          'box-shadow': '0 0 5px rgba(0, 0, 0, 0.02) inset',
          'border': '1px solid #f4f4f4'
        });

        function readSignature() {
          if (scope.$parent.isRequired(scope.component) && signaturePad.isEmpty()) {
            ngModel.$setViewValue('');
          }
          else {
            ngModel.$setViewValue(signaturePad.toDataURL());
          }
        }

        ngModel.$render = function() {
          var dataUrl = ngModel.$viewValue || '';
          signaturePad.fromDataURL(dataUrl);
        };
        signaturePad.onEnd = function() {
          scope.$evalAsync(readSignature);
        };
      }
    };
  }]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/signature.html', FormioUtils.fieldWrap(
        fs.readFileSync(__dirname + '/../templates/components/signature.html', 'utf8')
      ));

      $templateCache.put('formio/componentsView/signature.html', FormioUtils.fieldWrap(
        fs.readFileSync(__dirname + '/../templates/componentsView/signature.html', 'utf8')
      ));
    }
  ]);
};
