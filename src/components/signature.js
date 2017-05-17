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
          label: '',
          key: 'signature',
          placeholder: '',
          footer: 'Sign above',
          width: '100%',
          height: '150',
          penColor: 'black',
          backgroundColor: 'rgb(245,245,235)',
          minWidth: '0.5',
          maxWidth: '2.5',
          protected: false,
          persistent: true,
          hidden: false,
          clearOnHide: true,
          validate: {
            required: false
          }
        },
        viewTemplate: 'formio/componentsView/signature.html'
      });
    }
  ]);
  app.directive('signature', function() {
    return {
      restrict: 'A',
      scope: {
        component: '='
      },
      require: '?ngModel',
      link: function(scope, element, attrs, ngModel) {
        if (scope.builder) return;
        if (!ngModel) {
          return;
        }

        // Sets the label of component for error display.
        scope.component.label = 'Signature';
        scope.component.hideLabel = true;

        // Sets the dimension of a width or height.
        var setDimension = function(dim) {
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
          signaturePad.fromDataURL(ngModel.$viewValue);
        };
        signaturePad.onEnd = function() {
          scope.$evalAsync(readSignature);
        };
      }
    };
  });
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
