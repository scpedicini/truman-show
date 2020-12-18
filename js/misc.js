
class Misc {

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
     * @param x
     * @returns {{}}
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

    static ToggleClass($el, primClass, allClasses) {
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
        //return (dateObj ?? new Date()).toISOString().replace(/[TZ]/g, ' ').trim();
        return (dateObj ?? new Date()).toISOString().replace(/\.\d\d\d/g, '').trim();
    }

    // 2020-12-06T02:03:46
    static ConvertToLocaleTimeString(dateObj) {
        return  dateObj.getFullYear() + '-' + (dateObj.getMonth() + 1).toString().padStart(2, '0') + '-' +
                dateObj.getDate().toString().padStart(2, '0') + 'T' + dateObj.getHours().toString().padStart(2, '0') + ':' +
                dateObj.getMinutes().toString().padStart(2, '0') + ':' + dateObj.getSeconds().toString().padStart(2, '0');
    }

    static Render(template, paramobj) {
        if(paramobj instanceof Object) {
            for (let key in paramobj) {
                let re = new RegExp('{{' + key + '}}', 'gi');
                template = template.replace(re, paramobj[key]);
            }
        }

        return template;
    }

    static IsNumerical(str) {
        return !isNaN(parseInt(str));
    }

    static IsNullOrUndefined(x) { return x === undefined || x === null; }

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