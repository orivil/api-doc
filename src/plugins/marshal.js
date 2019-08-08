import Vue from 'vue'
import "@/assets/css/marshal.css"

Vue.use({
    install: function (Vue) {
        Vue.prototype.marked = require('marked');
        Vue.prototype.marshal_body = (body)=> {
            if (!body) {
                return '<span class="null">null</span>'
            }
            // see: https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body)
                } catch (e) {
                    return body
                }
            }
            body = JSON.stringify(body, null, 2);
            body = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return body.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
                var cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        };
    }
});