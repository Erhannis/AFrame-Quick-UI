window.Utils = (function() {
    const DIGITS = 6;
    function numberToFixed (number) {
        return parseFloat(number.toFixed(DIGITS));
    }

    function arrayNumbersToFixed (array) {
        for (var i = 0; i < array.length; i++) {
            array[i] = numberToFixed(array[i]);
        }
        return array;
    }

    function getTooltips (controllerName) {
        var tooltips;
        var tooltipName;
        switch (controllerName) {
            case 'windows-motion-samsung-controls': {
                tooltipName = '.windows-motion-samsung-tooltips';
                break;
            }
            case 'windows-motion-controls': {
                tooltipName = '.windows-motion-tooltips';
                break;
            }
            case 'oculus-touch-controls': {
                tooltipName = '.oculus-tooltips';
                break;
            }
            case 'vive-controls': {
                tooltipName = '.vive-tooltips';
                break;
            }
            default: {
                break;
            }
        }

        tooltips = Array.prototype.slice.call(document.querySelectorAll(tooltipName));
        return tooltips;
    }

    function mirrorQuaternion(q, dir) { //TODO I haven't actually verified this is correct
        q = q.clone();
        var a = 2*Math.acos(q.w);
        var n = new THREE.Vector3();
        var sa = Math.sin(a/2);
        n.x = q.x / sa;
        n.y = q.y / sa;
        n.z = q.z / sa;
        // Project onto and past `dir`
        n = n.clone().projectOnVector(dir).sub(n).multiplyScalar(2).add(n);
        q.x = n.x * sa;
        q.y = n.y * sa;
        q.z = n.z * sa;
        return q;
    }

    function mirrorVector(v, dir) { //TODO I haven't actually verified this is correct
        return v.clone().projectOnVector(dir).multiplyScalar(2).sub(v).negate();
    }

    return {
        numberToFixed: numberToFixed,
        arrayNumbersToFixed: arrayNumbersToFixed,
        getTooltips: getTooltips,
        mirrorQuaternion: mirrorQuaternion,
        mirrorVector: mirrorVector
    }
}());
