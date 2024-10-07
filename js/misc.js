
class Misc {

    // no matter how often it is called, it waits "delay" before invoking itself
    static debounce(fn, delay) {
        let timeout_fn = undefined;

        let debounce_fn = (...args) => {
            clearTimeout(timeout_fn);
            timeout_fn = setTimeout(() => {
                fn.call(this, ...args);
            }, delay);
        };

        debounce_fn.cancel = () => clearTimeout(timeout_fn);

        return debounce_fn;
    }

    /**
     * Check if element is below current viewport for DOM
     * @param $el
     * @returns {boolean}
     */
    static isBelow($el) {
        let win_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        let top = window.scrollY || window.scrollTop || document.getElementsByTagName('html')[0].scrollTop;
        let bottom = top + win_height;

        let rect = $el.getBoundingClientRect();

        let below_screen = rect.top > win_height;
        return below_screen;
    }


    /**
     * Simple CPU-bound blocking operation for testing purposes
     * @param baseNumber - higher the value, the longer the operation will block
     */
    static blockCPU(baseNumber) {
        console.time('blockCPU');
        let result = 0;
        for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {
            result += Math.atan(i) * Math.tan(i);
        }
        console.timeEnd('blockCPU');
    }

    /**
     * Convert a JSON string into a standard Javascript Object
     * @param x - JSON string
     * @returns {{}} - Deserialized object or empty object
     */
    static SafeParse(x) {
        let obj = { };
        try
        {
            if(x !== null && x !== undefined)
                obj = JSON.parse(x);
        }
        catch (e)
        {
            obj = { };
        }
        return obj;
    }

    static GetExtension(file) {
        return (file?.substring(file.lastIndexOf('.') + 1) ?? '').toLowerCase();
    }

    static toggleClass($el, primClass, allClasses) {
        allClasses.filter(c => c !== primClass).forEach( (c) => $el.classList.remove(c));
        $el.classList.add(primClass);
    }

    static Version() {
        return '1.0';
    }

    static PrefaceWithUriIdentifier(url) {
        if(!this.IsNullOrWhitespace(url) && url.match(/^\s*(https?|file):\/\//gi) === null)
        {
            url = 'file://' + url.trim();
        }
        return url;
    }

    /**
     * Creates a SQLite compatible UTC formatted TEXT string for use in DATETIME columns
     * @param dateObj - if undefined uses now
     * @returns {string}
     */
    static GetISOTime(dateObj = undefined)
    {
        return (dateObj ?? new Date()).toISOString().replace(/\.\d\d\d/g, '').trim();
    }

    /**
     * Convert a JS date object into a ISO compatible locale-time string
     * @param {Date} dateObj
     * @returns {string} - 2020-12-06T02:03:46
     * @constructor
     */
    static ConvertToLocaleTimeString(dateObj) {
        return  dateObj.getFullYear() + '-' + (dateObj.getMonth() + 1).toString().padStart(2, '0') + '-' +
                dateObj.getDate().toString().padStart(2, '0') + 'T' + dateObj.getHours().toString().padStart(2, '0') + ':' +
                dateObj.getMinutes().toString().padStart(2, '0') + ':' + dateObj.getSeconds().toString().padStart(2, '0');
    }


    static Render(template, paramobj) {
        if(paramobj instanceof Object) {
            for (let key in paramobj) {
                let re = new RegExp('{{' + key + '}}', 'gi');
                template = template.replaceAll(re, paramobj[key]);
            }
        }

        return template;
    }

    /**
     * Checks whether a string can be converted to a number (integer or float)
     * @param str
     * @returns {boolean}
     */
    static IsNumerical(str) {
        return !isNaN(parseInt(str));
    }

    static IsNullOrUndefined(x) { return typeof x === 'undefined' || x === null; }

    static IsNullOrWhitespace(x) { return this.IsNullOrUndefined(x) || x.trim().length === 0; }

    static RandomInteger(inclusiveMin, inclusiveMax) { return inclusiveMin + Math.floor(Math.random() * (inclusiveMax-inclusiveMin+1)); }

    static removeInsideElement($el) {
        while ($el.hasChildNodes()) {
            $el.removeChild($el.lastChild);
        }
    }


    /**
     * @param {String} html - representing a single element
     * @return {Element}
     */
    static htmlToElement(html) {
        let template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }
}


module.exports = Misc;