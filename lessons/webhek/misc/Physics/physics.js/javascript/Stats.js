/**
 * @author mrdoob / http://mrdoob.com/
 */

var Stats = function () {

    var startTime = Date.now(), prevTime = startTime;
    var ms = 0, msMin = Infinity, msMax = 0;
    var fps = 0, fpsMin = Infinity, fpsMax = 0;
    var frames = 0, mode = 0;

    var container = document.createElement('div');
    container.id = 'stats';
    container.style.cssText = 'position:absolute; ';

    var fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps';
    fpsDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;';
    container.appendChild(fpsDiv);

    var fpsText = document.createElement('div');
    fpsText.id = 'fpsText';
    fpsText.style.cssText = 'color:gray;font-size:8px;line-height:15px;';
    fpsText.innerHTML = 'FPS';
    fpsDiv.appendChild(fpsText);

    return {

        REVISION: 11,

        domElement: container,

        begin: function () {

            startTime = Date.now();

        },

        end: function () {

            var time = Date.now();

            ms = time - startTime;
            msMin = Math.min(msMin, ms);
            msMax = Math.max(msMax, ms);

            frames++;

            if (time > prevTime + 1000) {

                fps = Math.round(( frames * 1000 ) / ( time - prevTime ));
                fpsMin = Math.min(fpsMin, fps);
                fpsMax = Math.max(fpsMax, fps);

                fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';

                prevTime = time;
                frames = 0;

            }

            return time;

        },

        update: function () {

            startTime = this.end();

        }

    }

};
