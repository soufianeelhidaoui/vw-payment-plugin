(function (ns) {
    "use strict";

    ns.version = "7.5.0";

    // Global options and initialization
    var globalOptions;
    (function () {
        // options: 
        //	apiURL: string
        //	locale: string
        //	enableCyberSource: bool // Obsolete
        //  cardPaymentProvider: "cyberSourceWithTokenEx" | "cyberSource" | "vestaWithTokenEx" | "payonWithPCIProxy" | "payon". Default value: "payon".
        //	enablePayPal: bool. Default value: false.
        //  bankAccountPaymentProvider: "sepa" | "payon". Default value: "payon".
        ns.initialize = function (options) {
            globalOptions = new GlobalOptions();
            globalOptions.update(options);
        };

        var GlobalOptions = function () {
            var supportedPaymentOptionCodes = ["MSTRCRD", "VISA", "VISADBIT", "MSTRO", "AMEX", "CRTBANCAIR", "PAYPAL", "GIROPAY", "SFRTUBWNG", "IDEAL", "BNKACCT", "PAYU", "DISCOVER", "JCB", "VISAELTRN"];
            var supportedPaymentProviderPaymentOptions = [];

            function addProvider(code, paymentOptionCodes) {
                supportedPaymentProviderPaymentOptions.unshift({
                    code: code,
                    paymentOptionCodes: paymentOptionCodes
                });
            }

            addProvider("PAYON", ["MSTRCRD", "VISA", "VISADBIT", "MSTRO", "AMEX", "CRTBANCAIR", "PAYPAL", "GIROPAY", "SFRTUBWNG", "IDEAL", "BNKACCT", "JCB"]);
            addProvider("PAYMENTSOS", ["PAYU"]);

            var options = {
                apiURL: null,
                locale: null
            };

            this.getApiURL = function () {
                return options.apiURL;
            };

            this.getSupportedPaymentProviderPaymentOptions = function () {
                return supportedPaymentProviderPaymentOptions;
            };

            this.update = function (values) {
                utils.extend(options, values);

                if (values.apiURL && values.apiURL.substring(values.apiURL.length - 1) !== "/") {
                    options.apiURL += "/";
                }

                var locale = values.locale || options.locale;
                if (locale) {
                    l10n.locale(locale);
                }

                if (values.cardPaymentProvider && values.cardPaymentProvider.toLowerCase() === "cybersourcewithtokenex") {
                    addProvider("CYBERSOURCEWITHTOKENEX", ["MSTRCRD", "VISA", "AMEX", "DISCOVER", "JCB"]);
                } else if (values.cardPaymentProvider && values.cardPaymentProvider.toLowerCase() === "cybersource" || values.enableCyberSource) {
                    addProvider("CYBERSOURCE", ["MSTRCRD", "VISA", "MSTRO", "AMEX", "DISCOVER", "VISAELTRN"]);
                } else if (values.cardPaymentProvider && values.cardPaymentProvider.toLowerCase() === "vestawithtokenex") {
                    addProvider("VESTAWITHTOKENEX", ["MSTRCRD", "VISA", "AMEX", "DISCOVER"]);
                } else if (values.cardPaymentProvider && values.cardPaymentProvider.toLowerCase() === "payonwithpciproxy") {
                    addProvider("PAYONWITHPCIPROXY", ["MSTRCRD", "VISA", "VISADBIT", "MSTRO", "AMEX", "JCB"]);
                }

                if (values.enablePayPal) {
                    addProvider("PAYPAL", ["PAYPAL"]);
                }

                if (values.bankAccountPaymentProvider && values.bankAccountPaymentProvider.toLowerCase() === "sepa") {
                    addProvider("SEPA", ["BNKACCT"]);
                }
            };

            this.removeUnsupportedPaymentOptionCodes = function (paymentOptionCodes) {
                var filteredPaymentOptionCodes = paymentOptionCodes.filter(function (paymentOptionCode) {
                    return supportedPaymentOptionCodes.indexOf(paymentOptionCode) !== -1;
                });

                if (filteredPaymentOptionCodes.length !== paymentOptionCodes.length) {
                    throw new Error("The 'paymentOptionCodes' collection contains unsupported payment option codes.");
                }

                return filteredPaymentOptionCodes;
            };

            this.resolvePaymentProvider = function (paymentOptionCodes) {
                function arrayContainsAnotherArray(needle, haystack) {
                    for (var i = 0; i < needle.length; i++) {
                        if (haystack.indexOf(needle[i]) === -1) {
                            return false;
                        }
                    }
                    return true;
                }

                for (var i = 0; i < supportedPaymentProviderPaymentOptions.length; i++) {
                    var provider = supportedPaymentProviderPaymentOptions[i];
                    var isSupported = arrayContainsAnotherArray(paymentOptionCodes, provider.paymentOptionCodes);

                    if (isSupported) {
                        return provider.code;
                    }
                }
            };
        };

        globalOptions = new GlobalOptions();
    })();

    // Utils
    var utils;
    (function () {
        utils = new function () {
            this.url = function (url, data) {
                var parts = url.split("?");
                var urlPart = parts.shift();
                var parameters = {};

                var queryParts = parts.join("?").split("&");

                for (var i = 0; i < queryParts.length; i++) {
                    if (queryParts[i] === "") {
                        continue;
                    }

                    var parameterParts = queryParts[i].split("=");

                    parameters[parameterParts[0]] = parameterParts[1];
                }

                for (var paramName in data) {
                    if (data.hasOwnProperty(paramName)) {
                        var paramValue = data[paramName];
                        parameters[paramName] = encodeURIComponent(paramValue);
                    }
                }

                queryParts = [];
                for (var paramName1 in parameters) {
                    if (parameters.hasOwnProperty(paramName1)) {
                        var paramValue1 = parameters[paramName1];
                        queryParts.push(paramName1 + "=" + paramValue1);
                    }
                }

                return urlPart + "?" + queryParts.join("&");
            };

            this.extend = function (target) {
                Array.prototype.slice.call(arguments, 1).forEach(function (source) {
                    if (source) {
                        for (var prop in source) {
                            if (source[prop] !== null && source[prop].constructor === Object) {
                                if (!target[prop] || target[prop].constructor === Object) {
                                    target[prop] = target[prop] || {};
                                    utils.extend(target[prop], source[prop]);
                                } else {
                                    target[prop] = source[prop];
                                }
                            } else {
                                target[prop] = source[prop];
                            }
                        }
                    }
                });
                return target;
            };

            this.fireEvent = function (element, eventType, canBubble, cancelable) {
                var event = document.createEvent("HTMLEvents");
                event.initEvent(eventType, canBubble, cancelable);
                element.dispatchEvent(event);
            };

            this.addEventListener = function (event, callback) {
                if (document.addEventListener) {
                    document.addEventListener(event, callback);
                } else if (document.attachEvent) {
                    document.attachEvent(event, callback);
                }
            };

            this.getParameterByName = function (name, url) {
                if (!url) {
                    url = window.location.href;
                }

                name = name.replace(/[\[\]]/g, "\\$&");
                var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");

                var results = regex.exec(url);
                if (!results) {
                    return null;
                }

                if (!results[2]) {
                    return '';
                }

                return decodeURIComponent(results[2].replace(/\+/g, " "));
            };

            this.getUserLanguage = function () {
                return navigator.languages && navigator.languages[0] ||
                    navigator.language ||
                    navigator.userLanguage;
            };

            this.guid = function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var randomByte = new Uint8Array(1);
                    (window.crypto || window.msCrypto).getRandomValues(randomByte);

                    var r = randomByte[0] >> 4, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            this.guidNoDashes = function () {
                return this.guid().replace(/-/g, "");
            }

            this.detectBrowser = function (ua) {
                var browser = false, match = [], browserRxs = {
                    edge: /(edge)[ \/]([\w.]+)/i,
                    webkit: /(chrome|crios)[ \/]([\w.]+)/i,
                    safari: /(webkit)[ \/]([\w.]+)/i,
                    opera: /(opera)(?:.*version|)[ \/]([\w.]+)/i,
                    msie: /(msie\s|trident.*? rv:)([\w.]+)/i,
                    mozilla: /(mozilla)(?:.*? rv:([\w.]+)|)/i
                };
                for (var agent in browserRxs) {
                    if (browserRxs.hasOwnProperty(agent)) {
                        match = ua.match(browserRxs[agent]);
                        if (match) {
                            browser = {};
                            browser[agent] = true;
                            browser[match[1].toLowerCase().split(' ')[0].split('/')[0]] = true;
                            browser.version = parseInt(document.documentMode || match[2], 10);
                            break;
                        }
                    }
                }
                return browser;
            };

            this.saveFile = function (base64Content, fileName, mimeType) {
                function bom(blob, opts) {
                    if (typeof opts === 'undefined') opts = { autoBom: false }
                    else if (typeof opts !== 'object') {
                        console.warn('Deprecated: Expected third argument to be a object')
                        opts = { autoBom: !opts }
                    }

                    // prepend BOM for UTF-8 XML and text/* types (including HTML)
                    // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
                    if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                        return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type })
                    }
                    return blob
                }

                function download(url, name, opts) {
                    var xhr = new XMLHttpRequest()
                    xhr.open('GET', url)
                    xhr.responseType = 'blob'
                    xhr.onload = function () {
                        saveAs(xhr.response, name, opts)
                    }
                    xhr.onerror = function () {
                        console.error('could not download file')
                    }
                    xhr.send()
                }

                function corsEnabled(url) {
                    var xhr = new XMLHttpRequest()
                    // use sync to avoid popup blocker
                    xhr.open('HEAD', url, false)
                    xhr.send()
                    return xhr.status >= 200 && xhr.status <= 299
                }

                function click(node) {
                    try {
                        node.dispatchEvent(new MouseEvent('click'))
                    } catch (e) {
                        var evt = document.createEvent('MouseEvents')
                        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
                            20, false, false, false, false, 0, null)
                        node.dispatchEvent(evt)
                    }
                }
                // The one and only way of getting global scope in all environments
                // https://stackoverflow.com/q/3277182/1008999
                var _global = typeof window === 'object' && window.window === window
                    ? window : typeof self === 'object' && self.self === self
                        ? self : typeof global === 'object' && global.global === global
                            ? global
                            : this

                var saveAs = 'download' in HTMLAnchorElement.prototype
                    ? function saveAs(blob, name, opts) {
                        var URL = _global.URL || _global.webkitURL
                        var a = document.createElement('a')
                        name = name || blob.name || 'download'

                        a.download = name
                        a.rel = 'noopener' // tabnabbing

                        if (typeof blob === 'string') {
                            // Support regular links
                            a.href = blob
                            if (a.origin !== location.origin) {
                                corsEnabled(a.href)
                                    ? download(blob, name, opts)
                                    : click(a, a.target = '_blank')
                            } else {
                                click(a)
                            }
                        } else {
                            // Support blobs
                            a.href = URL.createObjectURL(blob)
                            setTimeout(function () { URL.revokeObjectURL(a.href) }, 4E4) // 40s
                            setTimeout(function () { click(a) }, 0)
                        }
                    }

                    // Use msSaveOrOpenBlob as a second approach
                    : 'msSaveOrOpenBlob' in navigator
                        ? function saveAs(blob, name, opts) {
                            name = name || blob.name || 'download'

                            if (typeof blob === 'string') {
                                if (corsEnabled(blob)) {
                                    download(blob, name, opts)
                                } else {
                                    var a = document.createElement('a')
                                    a.href = blob
                                    a.target = '_blank'
                                    setTimeout(function () { click(a) })
                                }
                            } else {
                                navigator.msSaveOrOpenBlob(bom(blob, opts), name)
                            }
                        }

                        // Fallback to using FileReader and a popup
                        : function saveAs(blob, name, opts, popup) {
                            // Open a popup immediately do go around popup blocker
                            // Mostly only available on user interaction and the fileReader is async so...
                            popup = popup || open('', '_blank')
                            if (popup) {
                                popup.document.title =
                                    popup.document.body.innerText = 'downloading...'
                            }

                            if (typeof blob === 'string') return download(blob, name, opts)

                            var force = blob.type === 'application/octet-stream'
                            var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari
                            var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent)

                            if ((isChromeIOS || (force && isSafari)) && typeof FileReader === 'object') {
                                // Safari doesn't allow downloading of blob URLs
                                var reader = new FileReader()
                                reader.onloadend = function () {
                                    var url = reader.result
                                    url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;')
                                    if (popup) popup.location.href = url
                                    else location = url
                                    popup = null // reverse-tabnabbing #460
                                }
                                reader.readAsDataURL(blob)
                            } else {
                                var URL = _global.URL || _global.webkitURL
                                var url = URL.createObjectURL(blob)
                                if (popup) popup.location = url
                                else location.href = url
                                popup = null // reverse-tabnabbing #460
                                setTimeout(function () { URL.revokeObjectURL(url) }, 4E4) // 40s
                            }
                        }

                function base64ToBytes(base64Content) {
                    var binaryString = window.atob(base64Content);
                    var length = binaryString.length;
                    var bytes = new Uint8Array(length);
                    for (var i = 0; i < length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    return bytes.buffer;
                }

                var blob = new Blob([base64ToBytes(base64Content)], { type: mimeType });

                return saveAs(blob, fileName);
            };

            this.validateStringForRestrictedSymbols = function (str) {
                return str.match(/^[^%\{\[\]\}\$€ÄäÖöÜüß§\?@\&\#\^\<\>]*$/);
            };

            this.onScrollToEnd = function (element, offset, handler) {
                var isFired = false;

                var handleScroll = function (elem) {
                    if (elem.scrollHeight - elem.scrollTop - offset <= elem.clientHeight) {
                        if (!isFired) {
                            isFired = true;
                            handler();
                        }
                    }
                };

                element.addEventListener("scroll", function (e) {
                    handleScroll(e.target);
                });

                // Right after the content has been set into the element its dimensions won't be updated yet, so we wait
                setTimeout(function () {
                    // Check if the content already fits into the element without a scroll
                    handleScroll(element);
                }, 1);
            };

            this.format = function (fmt, valuesArray) {
                return fmt.replace(/\{(\d+)(:[^\}]+)?\}/g, function (match, number) {
                    return typeof valuesArray[number] !== "undefined" ? valuesArray[number] : match;
                });
            };

            this.isUrl = function (value) {
                // https://gist.github.com/dperini/729294
                var regex = "^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))?)(?::\\d{2,5})?(?:[/?#]\\S*)?$";
                var pattern = new RegExp(regex, 'i');

                return typeof value === "string" && pattern.exec(value);
            };
        };
    })();

    ns.onReady = function (callback) {
        utils.addEventListener("DOMContentLoaded", function (e) {
            callback();
        });
    };

    var apiHelper;
    (function () {
        apiHelper = new function () {
            var self = this;

            var send = function (method, relativeUrl, urlData, bodyData) {
                if (!globalOptions.getApiURL()) {
                    throw new Error("API URL is not set. Use kc.initialize method to initialize SDK.")
                }

                var complete;

                var result = {
                    complete: function (c) {
                        complete = c;
                    }
                }

                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        switch (this.status) {
                            case 200:
                                if (complete && typeof complete.success === "function") {
                                    var responseObject = JSON.parse(this.responseText);
                                    complete.success(responseObject);
                                }
                                break;
                            default:
                                if (complete && typeof complete.error === "function") {
                                    var contentTypeHeader = this.getResponseHeader("Content-Type") || "";

                                    var errorData;
                                    if (contentTypeHeader.toLowerCase().indexOf("application/json") !== -1) {
                                        errorData = JSON.parse(this.responseText);
                                    } else {
                                        errorData = {
                                            responseCode: "",
                                            responseDescription: this.responseText
                                        };
                                    }

                                    complete.error(errorData);
                                }
                        }
                    }
                };

                xhttp.open(method, utils.url(globalOptions.getApiURL() + relativeUrl, urlData), true);
                xhttp.setRequestHeader("Content-Type", 'application/json')

                xhttp.send(!!bodyData ? JSON.stringify(bodyData) : null);

                return result;
            };

            this.get = function (relativeUrl, urlData) {
                return send("GET", relativeUrl, urlData);
            };

            this.post = function (relativeUrl, urlData, bodyData) {
                return send("POST", relativeUrl, urlData, bodyData);
            };

            this.put = function (relativeUrl, urlData, bodyData) {
                return send("PUT", relativeUrl, urlData, bodyData);
            };

            this.delete = function (relativeUrl, urlData, bodyData) {
                return send("DELETE", relativeUrl, urlData, bodyData);
            };

            function pad(num, len) {
                var s = num.toString();
                while (s.length < len) {
                    s = "0" + s;
                }

                return s;
            }

            this.createRequestObject = function (data) {
                var now = new Date();
                return utils.extend({
                    partnerReference: "WSDK-" + utils.guidNoDashes(),
                    localDate: pad(now.getFullYear(), 4) + "-" + pad(now.getMonth() + 1, 2) + "-" + pad(now.getDate(), 2),
                    localTime: pad(now.getHours(), 2) + pad(now.getMinutes(), 2) + pad(now.getSeconds(), 2)
                },
                    data);
            };
        };
    })();

    // Localization
    var l10n;
    (function () {
        var defaultTranslateOptions = {
            fallback: true
        }

        l10n = new function () {
            this.cultures = {};

            this.options = utils.extend({}, {
                fallbackCulture: "en"
            });

            this.locale = function (locale) {
                if (locale !== undefined) {
                    if (locale === null) {
                        throw new Error("Locale can not be null.");
                    }

                    this.options.locale = locale;
                } else {
                    if (!this.options.locale) {
                        this.options.locale = utils.getUserLanguage() || "en-US";
                    }

                    return this.options.locale;
                }
            };

            this.getCulture = function () {
                return this.locale().split('-')[0];
            };

            this.translate = function (key, options) {
                var self = this;
                var code;

                options = utils.extend({}, defaultTranslateOptions, options);

                if (!key) {
                    throw new Error("Localization string key is not defined.");
                }

                var keyTokens = key.split(".");

                function tr(l) {
                    var result = null;
                    var culture = self.cultures[l];

                    if (culture !== undefined) {
                        var strings = culture.strings;
                        for (var i = 0; i < keyTokens.length; i++) {
                            code = keyTokens[i];
                            if (typeof strings[code] === "object") {
                                strings = strings[code];
                            }
                            if (typeof strings[code] === "string") {
                                result = strings[code];
                                break;
                            }
                        }
                    }

                    return result;
                }

                var string = tr(this.getCulture()) ||
                    (options.fallback ? tr(this.options.fallbackCulture) : null);

                if (!string && options.fallback) {
                    console.warn("Translation was not found for key: " + key);
                    string = key;
                }

                return string;
            };
        };

        l10n.cultures["en"] = { // English
            strings: {
                "payment_form_invalid_iban_country": "IBAN does not belong to a SEPA country",
                "payment_form_invalid_account_holder": "Invalid account holder",
                "validation_msg_card_holder": "Please enter your name exactly as it appears on your credit card",
                "payment_form_store_payment_method": "Store payment method?",
                "user_agreement_accept_button": "Accept",
                "user_agreement_widget_mode1_btn_close": "Agree and Create Account",
                "user_agreement_widget_mode_btn_back": "Back",
                "user_agreement_widget_lnk_download": "Download Terms and Conditions",
                "aspo_newcard_txt_card_number": "Card Number",
                "aspo_newcard_txt_expiry_date": "Expiry Date",
                "aspo_newcard_txt_card_holder": "Card Holder",
                "aspo_newcard_txt_cvv": "CVV",
                "aspo_newcard_txt_acc_holder": "Account Holder",
                "aspo_newcard_txt_iban": "IBAN",
                "user_agreement_widget_agree_err_txt": "It is required that you agree to the terms and conditions of {0}. Please review the terms and conditions and check the checkbox that you agree with them.",
                "user_agreement_widget_mode_chb_agree": "I am of legal age, have read, saved and agree to the Terms and Conditions and Privacy Policy of {0}.",
                "payment_cybersource_btn_pay": "Pay",
                "validation_msg_invalid": "Invalid '{0}'."
            }
        };

        l10n.cultures["de"] = { // German
            strings: {
                "payment_form_invalid_iban_country": "IBAN gehört nicht zu einem Land der SEPA-Liste",
                "payment_form_invalid_account_holder": "Ungültiger Kontoinhaber",
                "validation_msg_card_holder": "Bitte geben Sie Ihren Namen genau so ein, wie er auf Ihrer Kreditkarte steht",
                "payment_form_store_payment_method": "Zahlungsart speichern?",
                "user_agreement_accept_button": "Zustimmen",
                "user_agreement_widget_mode1_btn_close": "Zustimmen und Konto eröffnen",
                "user_agreement_widget_mode_btn_back": "Zurück",
                "user_agreement_widget_lnk_download": "Allgemeine Geschäftsbedingungen herunterladen",
                "aspo_newcard_txt_card_number": "Kartennummer",
                "aspo_newcard_txt_expiry_date": "Ablaufdatum",
                "aspo_newcard_txt_card_holder": "Karteninhaber",
                "aspo_newcard_txt_cvv": "Kartenprüfnummer",
                "aspo_newcard_txt_acc_holder": "Kontoinhaber",
                "aspo_newcard_txt_iban": "IBAN",
                "user_agreement_widget_agree_err_txt": "Es ist erforderlich, dass Sie den Allgemeinen Geschäftsbedinungen von {0} zustimmen. Bitte überprüfen Sie die Allgemeinen Geschäftsbedingungen und bestätigen Sie, dass Sie einverstanden sind, indem Sie das Häkchen im Kontrollkästchen setzen. ",
                "user_agreement_widget_mode_chb_agree": "Ich bin volljährig und habe die Allgemeinen Geschäftsbedingungen und die Datenschutzerklärung von {0} gelesen, gespeichert und akzeptiert.",
                "payment_cybersource_btn_pay": "Bezahlen",
                "validation_msg_invalid": "'{0}' ist ungültig."
            }
        };

        l10n.cultures["el"] = { // Greek
            strings: {
                "payment_form_invalid_iban_country": "Το ΙΒΑΝ δεν ανήκει σε χώρα του SEPA",
                "payment_form_invalid_account_holder": "Παρακαλώ εισάγετε μια τιμή για κάτοχος λογαριασμού",
                "validation_msg_card_holder": "Παρακαλώ εισάγετε μια τιμή για κάτοχο της κάρτας",
                "payment_form_store_payment_method": "Να αποθηκευτεί η μέθοδος πληρωμών?"
            }
        };

        l10n.cultures["es"] = { // Spanish
            strings: {
                "payment_form_invalid_iban_country": "El IBAN no pertenece a un país SEPA",
                "payment_form_invalid_account_holder": "Titular de la cuenta no válido",
                "validation_msg_card_holder": "Introduzca su nombre exactamente como aparece en su tarjeta de crédito",
                "payment_form_store_payment_method": "¿Guardar el método de pago?",
                "user_agreement_accept_button": "Aceptar",
                "user_agreement_widget_mode1_btn_close": "Aceptar y abrir cuenta",
                "user_agreement_widget_mode_btn_back": "Atrás",
                "user_agreement_widget_lnk_download": "Descargar los términos y condiciones",
                "aspo_newcard_txt_card_number": "Número de tarjeta",
                "aspo_newcard_txt_expiry_date": "Fecha de expiración",
                "aspo_newcard_txt_card_holder": "Titular de la tarjeta",
                "aspo_newcard_txt_cvv": "Código de seguridad",
                "aspo_newcard_txt_acc_holder": "Titular de la cuenta",
                "aspo_newcard_txt_iban": "IBAN",
                "user_agreement_widget_agree_err_txt": "Es necesario que acepte los términos y condiciones de {0}. Por favor, revise los términos y condiciones y marque la casilla de verificación si está de acuerdo con ellos.",
                "user_agreement_widget_mode_chb_agree": "Soy mayor de edad, he leído, guardado y acepto los Términos y Condiciones y la Política de Privacidad de {0}.",
                "payment_cybersource_btn_pay": "Pagar",
                "validation_msg_invalid": "'{0}' no válido."
            }
        };

        l10n.cultures["et"] = { // Estonian
            strings: {
                "payment_form_invalid_iban_country": "IBAN ei kuulu SEPA riigile",
                "payment_form_invalid_account_holder": "Kehtetu konto omanik",
                "validation_msg_card_holder": "Kehtetu kaardi omanik",
                "payment_form_store_payment_method": "Salvestada makseviis?"
            }
        };

        l10n.cultures["fi"] = { // Finnish
            strings: {
                "payment_form_invalid_iban_country": "IBAN ei ole SEPA-alueen tilinumero",
                "payment_form_invalid_account_holder": "Virheellinen tilin haltijan",
                "validation_msg_card_holder": "Virheellinen kortin haltija",
                "payment_form_store_payment_method": "Tallennetaanko maksutapa?"
            }
        };

        l10n.cultures["fr"] = { // French
            strings: {
                "payment_form_invalid_iban_country": "L'IBAN ne correspond à aucun pays de la procédure SEPA",
                "payment_form_invalid_account_holder": "Titulaire de compte invalide",
                "validation_msg_card_holder": "Veuillez spécifier le nom exact tel qu’écrit sur votre carte de crédit",
                "payment_form_store_payment_method": "Stocker les méthodes de payement ?",
                "user_agreement_accept_button": "Accepter",
                "user_agreement_widget_mode1_btn_close": "J’accepte et crée un compte",
                "user_agreement_widget_mode_btn_back": "Précédent",
                "user_agreement_widget_lnk_download": "Télécharger les Conditions générales d’utilisation",
                "aspo_newcard_txt_card_number": "Numéro de carte",
                "aspo_newcard_txt_expiry_date": "Date d'expiration",
                "aspo_newcard_txt_card_holder": "Titulaire de la carte",
                "aspo_newcard_txt_cvv": "CVV",
                "aspo_newcard_txt_acc_holder": "Titulaire de compte",
                "aspo_newcard_txt_iban": "IBAN",
                "user_agreement_widget_agree_err_txt": "Vous devez accepter les Conditions générales d’utilisation de {0}. Veuillez consulter les Conditions générales d’utilisation et cocher la case indiquant que vous les acceptez.",
                "user_agreement_widget_mode_chb_agree": "Je suis majeur, j'ai lu, enregistré et accepté les Conditions générales d’utilisation et la Déclaration de confidentialité de {0}.",
                "payment_cybersource_btn_pay": "Payer",
                "validation_msg_invalid": "« {0} » non valide."
            }
        };

        l10n.cultures["it"] = { // Italian
            strings: {
                "payment_form_invalid_iban_country": "L’IBAN non appartiene a un paese del circuito SEPA",
                "payment_form_invalid_account_holder": "Titolare del Conto non valida",
                "validation_msg_card_holder": "Inserisca il Suo nome esattamente come riportato sulla Sua carta di credito",
                "payment_form_store_payment_method": "Salvare metodo di pagamento?",
                "user_agreement_accept_button": "Accetta",
                "user_agreement_widget_mode1_btn_close": "Accettare e creare conto",
                "user_agreement_widget_mode_btn_back": "Indietro",
                "user_agreement_widget_lnk_download": "Scaricare le condizioni generali di contratto",
                "aspo_newcard_txt_card_number": "Numero carta",
                "aspo_newcard_txt_expiry_date": "Data di scadenza",
                "aspo_newcard_txt_card_holder": "Titolare della carta",
                "aspo_newcard_txt_cvv": "CVV",
                "aspo_newcard_txt_acc_holder": "Titolare del Conto",
                "aspo_newcard_txt_iban": "IBAN",
                "user_agreement_widget_agree_err_txt": "Deve accettare le condizioni generali di contratto di {0}. La preghiamo di esaminare le condizioni generali di contratto e di spuntare la casella di controllo per accettarli.",
                "user_agreement_widget_mode_chb_agree": "Sono maggiorenne; ho letto, salvato e accettato le condizioni generali di contratto e l'informativa sulla privacy di {0}.",
                "payment_cybersource_btn_pay": "Pagare",
                "validation_msg_invalid": "'{0}' non valido."
            }
        };

        l10n.cultures["lt"] = { // Lithuanian
            strings: {
                "payment_form_invalid_iban_country": "IBAN nepriklauso SEPA šaliai",
                "payment_form_invalid_account_holder": "Neteisingas sąskaitos turėtojas",
                "validation_msg_card_holder": "Neteisingas sąskaitos turėtojas",
                "payment_form_store_payment_method": "Išsaugoti mokėjimo būdą?"
            }
        };

        l10n.cultures["lv"] = { // Latvian
            strings: {
                "payment_form_invalid_iban_country": "IBAN nepieder SEPA valstij",
                "payment_form_invalid_account_holder": "Neatbilstošs konta turētājs",
                "validation_msg_card_holder": "Neatbilstošs kartes turētājs",
                "payment_form_store_payment_method": "Saglabāt maksājuma veidu?"
            }
        };

        l10n.cultures["nl"] = { // Dutch
            strings: {
                "payment_form_invalid_iban_country": "IBAN hoort niet bij een SEPA-land",
                "payment_form_invalid_account_holder": "Ongeldig eigenaar",
                "validation_msg_card_holder": "Ongeldige kaarthouder",
                "payment_form_store_payment_method": "Betalingsmethode opslaan?"
            }
        };

        l10n.cultures["pt"] = { // Portuguese
            strings: {
                "payment_form_invalid_iban_country": "O IBAN não pertence a um país SEPA",
                "payment_form_invalid_account_holder": "Por favor insira um valor para o Titular da conta",
                "validation_msg_card_holder": "Por favor insira um valor para o Titular do cartão",
                "payment_form_store_payment_method": "Guardar método de pagamento?"
            }
        };

        l10n.cultures["sk"] = { // Slovak
            strings: {
                "payment_form_invalid_iban_country": "IBAN neprináleží žiadnej krajine SEPA",
                "payment_form_invalid_account_holder": "Zadajte prosím hodnotu Majiteľ účtu",
                "validation_msg_card_holder": "Zadajte prosím hodnotu Držiteľ karty",
                "payment_form_store_payment_method": "Uložiť platobnú metódu?"
            }
        };

        l10n.cultures["sl"] = { // Slovenian
            strings: {
                "payment_form_invalid_iban_country": "IBAN ne pripada državi SEPA",
                "payment_form_invalid_account_holder": "Vnesite vrednosti za Ime lastnika",
                "validation_msg_card_holder": "Vnesite vrednosti za Ime lastnika",
                "payment_form_store_payment_method": "Shrani način plačila?"
            }
        };

        l10n.cultures["pl"] = { // Polish
            strings: {
                "cvvError": "Nieprawidłowy CVV"
            }
        };
    }());

    // Payment Form
    (function () {
        var payonPaymentOptionCodeMap = {
            "MSTRCRD": { value: "MASTER", group: "card" },
            "VISA": { value: "VISA", group: "card" },
            "VISADBIT": { value: "VISADEBIT", group: "card" },
            "MSTRO": { value: "MAESTRO", group: "card" },
            "AMEX": { value: "AMEX", group: "card" },
            "CRTBANCAIR": { value: "CARTEBANCAIRE", group: "card" },
            "JCB": { value: "JCB", group: "card" },
            "PAYPAL": { value: "PAYPAL", group: "other" },
            "GIROPAY": { value: "GIROPAY", group: "other" },
            "SFRTUBWNG": { value: "SOFORTUEBERWEISUNG", group: "other" },
            "IDEAL": { value: "IDEAL", group: "other" },
            "BNKACCT": { value: "DIRECTDEBIT_SEPA", group: "other" }
        };

        var supportedIbanCountries = ["AT", "BE", "CH", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "IE", "IT", "LT", "LU", "LV", "MC", "MT", "NL", "PT", "SI", "SK", "SM"];

        function requestWebAPIPaymentForm(target, options, route, dataFieldNames, paymentGroup) {
            var paymentData = {};
            var paymentDataMapper;
            switch (paymentGroup) {
                case "CARDS":
                    paymentDataMapper = function (paymentData, formData) {
                        switch (formData.input) {
                            case "brand":
                                paymentData["paymentBrand"] = formData.value;
                                break;
                            case "card_expiry_date":
                                paymentData["expiryDate"] = formData.value;
                                break;
                            case "merchant_defined_data1":
                                paymentData["cardHolder"] = formData.value;
                                break;
                        }
                    }
                    break;

                case "BANKS":
                    paymentDataMapper = function (paymentData, formData) {
                        switch (formData.input) {
                            case "iban":
                                paymentData["iban"] = formData.value;
                                break;
                            case "account_holder":
                                paymentData["accountHolder"] = formData.value;
                                break;
                            case "bank_name":
                                paymentData["bankName"] = formData.value;
                                break;
                        }
                    }
            }

            var formElement = document.createElement("form");
            formElement.method = "post";
            formElement.action = globalOptions.getApiURL() + route;
            formElement.target = "paymentForm";
            formElement.setAttribute("data-ajax", "true");
            target.appendChild(formElement);

            var frame = document.createElement("iframe");
            frame.name = "paymentForm";
            frame.style.border = "none";
            frame.style.width = "100%";
            frame.style.maxWidth = "100%";
            target.appendChild(frame);

            var versionInputElement = document.createElement("input");
            versionInputElement.type = "hidden";
            versionInputElement.name = "compatibleVersion";
            versionInputElement.value = ns.version;
            formElement.appendChild(versionInputElement);

            for (var i = 0; i < dataFieldNames.length; i++) {
                var inputName = dataFieldNames[i];
                var inputValue = undefined;

                switch (inputName) {
                    case "locale":
                        inputValue = l10n.locale();
                        break;

                    default:
                        if (options[inputName] === undefined || options[inputName] === null) {
                            break;
                        }

                        if (Array.isArray(options[inputName])) {
                            inputValue = JSON.stringify(options[inputName]);
                        } else {
                            inputValue = options[inputName];
                        }
                        break;
                }

                if (inputName == null || inputValue === undefined || inputValue === null) {
                    continue;
                }

                var inputElement = document.createElement("input");
                inputElement.type = "hidden";
                inputElement.name = inputName;
                inputElement.value = inputValue;

                formElement.appendChild(inputElement);
            }

            function onIFrameMessage(messageEvent) {
                function submit() {
                    frame.contentWindow.postMessage({
                        cw: {
                            messageReason: "submit"
                        }
                    }, "*");
                }

                function cancelSubmit() {
                    frame.contentWindow.postMessage({
                        cw: {
                            messageReason: "cancelSubmit"
                        }
                    }, "*");
                }

                function updatePaymentData() {
                    if (cwData.messageData && cwData.messageData.input && typeof paymentDataMapper == "function") {
                        paymentDataMapper(paymentData, cwData.messageData);

                        if (typeof options.paymentInfoCallback == "function") {
                            options.paymentInfoCallback(paymentData);
                        }
                    }
                }

                var cwData = messageEvent.data && messageEvent.data.cw;
                if (!cwData || !cwData.messageReason) {
                    return;
                }

                switch (cwData.messageReason) {
                    case "changed":
                        updatePaymentData();
                        break;

                    case "ready":
                        if (typeof options.onFormLoaded == "function") {
                            options.onFormLoaded();
                        }
                        break;

                    case "submit":
                        updatePaymentData();

                        if (typeof options.onBeforeSubmit == "function") {
                            options.onBeforeSubmit(paymentData, submit, cancelSubmit);
                        } else {
                            submit();
                        }
                        break;

                    case "error":
                        if (typeof options.onError == "function") {
                            // Backward compatibily: the data format remains the same as it was in WebSDK < 6.8.0
                            var onErrorDataObject = {
                                reason: cwData.messageReason,
                                value: cwData.messageData.value
                            };

                            options.onError(cwData.messageData.value, onErrorDataObject);
                        } else {
                            throw new Error(JSON.stringify(cwData.messageData.value));
                        }
                        break;
                }
            }

            window.addEventListener("message", onIFrameMessage);

            formElement.submit();

            return function () {
                window.removeEventListener("message", onIFrameMessage);
            };
        }

        function initPaymentsOs(target, options) {
            var authorizationTokenParts = options.authorizationToken.split("#");
            var urlParts = authorizationTokenParts[0].split("?");
            var location;

            if (urlParts.slice(1).join("?").search(/(\&|^)lang\=\w+(\-\w+)?(\&|$)/) === -1 && l10n.options.locale) {
                var locale = "lang=" + l10n.getCulture();
                if (urlParts.length > 1) {
                    urlParts[urlParts.length - 1] += "&" + locale;
                } else {
                    urlParts.push(locale);
                }

                authorizationTokenParts[0] = urlParts.join("?");
                location = authorizationTokenParts.join("#");
            } else {
                location = options.authorizationToken;
            }

            if (!utils.isUrl(location)) {
                throw new Error("Provided 'authorizationToken' is not a valid URI.");
            }

            window.location = location;
        }

        function initPayon(target, options) {
            if (!options.paymentOptionCodes || options.paymentOptionCodes.length === 0) {
                return null;
            }

            var paymentBrands = options.paymentOptionCodes.map(function (paymentOptionCode, index) {
                var paymentBrand = payonPaymentOptionCodeMap[paymentOptionCode];

                if (paymentBrand == null) {
                    throw "Payment option code '" + paymentOptionCode + "' is invalid.";
                }

                return paymentBrand;
            });

            if (paymentBrands.some(function (paymentBrand) { return paymentBrand === "other"; })) {
                if (paymentBrands.some(function (paymentBrand) { return paymentBrand === "card"; })) {
                    throw "Payment option codes collection cannot contain codes from different payment groups. " +
                    "There should be either only codes from payment group 'Cards' or a single code from payment group 'Other'.";
                }

                if (paymentBrands.length > 1) {
                    throw "Payment option codes collection cannot contain multiple codes from payment group 'Other'.";
                }
            }

            if (!options.paymentProviderMode) {
                throw "paymentProviderMode required.";
            }

            var payonUrl;
            switch (options.paymentProviderMode) {
                case "live":
                    payonUrl = "https://oppwa.com/v1/paymentWidgets.js";
                    break;
                case "test":
                    payonUrl = "https://test.oppwa.com/v1/paymentWidgets.js";
                    break;
                default:
                    throw "Invalid parameter value: paymentProviderMode";
            }

            var formElement = document.createElement("form");
            formElement.action = options.callbackUrl;
            formElement.className = "paymentWidgets";
            formElement.setAttribute("data-brands", paymentBrands.map(function (paymentBrand) { return paymentBrand.value; }).join(" "));
            target.appendChild(formElement);

            var customCss = "";
            var wpwlOptions = window.wpwlOptions = {};

            function createOnBeforeSubmitHandler(disableSubmitPrevent, validateForm, dataFields) {
                return function (e) {
                    if (typeof validateForm === "function" && !validateForm()) {
                        return false;
                    }

                    var data = {};

                    if (typeof dataFields == "object") {
                        for (var key in dataFields) {
                            var input = document.querySelector(dataFields[key]);
                            if (input) {
                                data[key] = input.value;
                            }
                        }
                    }

                    if (typeof options.paymentInfoCallback == "function") {
                        options.paymentInfoCallback(data);
                    }

                    var button = document.querySelector(".wpwl-button");

                    if (typeof options.onBeforeSubmit == "function" && !disableSubmitPrevent) {
                        e.preventDefault();
                        button.disabled = false;

                        options.onBeforeSubmit(data, function () {
                            disableSubmitPrevent = true;
                            setTimeout(function () {
                                button.click();
                            }, 1);
                        });

                        return false;
                    }

                    return true;
                };
            }

            function addValidationError(element, message) {
                element.classList.add("wpwl-has-error");
                var validationMessageElement = document.createElement("div");
                validationMessageElement.classList.add("wpwl-hint");
                validationMessageElement.appendChild(document.createTextNode(message));

                element.parentNode.insertBefore(validationMessageElement, element.nextSibling);

                var payButton = document.querySelector(".wpwl-button-pay");
                payButton.classList.add("wpwl-button-error");
                payButton.disabled = true;
            }

            var iframePlaceholderStyles = {};
            if (!options.showPlaceholders) {
                customCss += ".wpwl-control::-webkit-input-placeholder {  opacity: 0; }\n";
                customCss += ".wpwl-control::-moz-placeholder {  opacity: 0; }\n";
                customCss += ".wpwl-control:-ms-input-placeholder {  opacity: 0; }\n";

                iframePlaceholderStyles["opacity"] = "0";
            } else {
                iframePlaceholderStyles["color"] = options.placeholdersColor;
            }

            var latestBrand, useBrandDetection = paymentBrands.length > 1;

            function getPayonCulture() {
                var culture = l10n.getCulture();

                switch (culture) {
                    case "zh":
                        return "cn";
                    case "cs":
                        return "cz";
                    case "el":
                        return "gr";
                    default:
                        return culture;
                }
            }

            function getTranslations(translationKeys) {
                return Object.keys(translationKeys).reduce(function (result, labelKey) {
                    var translationKey = translationKeys[labelKey];
                    var translation = l10n.translate(translationKey.key, { fallback: false });
                    if (translation) {
                        if (Array.isArray(translationKey.formatKeys)) {
                            var formatValues = [];
                            for (var i = 0; i < translationKey.formatKeys.length; i++) {
                                formatValues.push(l10n.translate(translationKey.formatKeys[i], { fallback: false }));
                            }
                            translation = utils.format(translation, formatValues);
                        }
                        result[labelKey] = translation;
                    }

                    return result;
                }, {});
            }

            utils.extend(wpwlOptions, {
                style: "plain",
                labels: getTranslations({
                    accountHolder: { key: "aspo_newcard_txt_acc_holder" },
                    accountIban: { key: "aspo_newcard_txt_iban" },
                    cardHolder: { key: "aspo_newcard_txt_card_holder" },
                    cardHolderError: { key: "validation_msg_card_holder" },
                    cardNumber: { key: "aspo_newcard_txt_card_number" },
                    cvv: { key: "aspo_newcard_txt_cvv" },
                    expiryDate: { key: "aspo_newcard_txt_expiry_date" }
                }),
                errorMessages: getTranslations({
                    cvvError: { key: "cvvError" },
                    accountHolderError: { key: "validation_msg_invalid", formatKeys: ["aspo_newcard_txt_acc_holder"] },
                    accountIbanError: { key: "validation_msg_invalid", formatKeys: ["aspo_newcard_txt_iban"] }
                }),
                registrations: {
                    requireCvv: options.requireCvv || false,
                    hideInitialPaymentForms: true
                },
                locale: getPayonCulture(),
                showLabels: options.showLabels,
                showCVVHint: options.showCVVHint,
                useSummaryPage: !!options.confirmationUrl,
                brandDetection: useBrandDetection,
                onChangeBrand: function (brand) {
                    var brandLogo = document.querySelector("form.wpwl-form-card .wpwl-brand-card");
                    var brandLabel = document.querySelector("form.wpwl-form-card .wpwl-label-brand");

                    if (useBrandDetection) {
                        if (typeof latestBrand === "undefined") {
                            // Hide logo on initial load
                            brandLogo.style.display = "none";
                            if (options.showLabels) {
                                brandLabel.style.visibility = "hidden";
                            }

                            latestBrand = null;
                        } else if (brand !== latestBrand) {
                            brandLogo.style.display = null;
                            if (options.showLabels) {
                                brandLabel.style.visibility = null;
                            }
                            latestBrand = brand;
                        }
                    }
                },
                onSaveTransactionData: function (data) {
                    location.href = utils.url(options.confirmationUrl, { authorizationToken: options.authorizationToken });
                },
                iframeStyles: utils.extend({}, options.iframeStyles, {
                    "card-number-placeholder": iframePlaceholderStyles,
                    "cvv-placeholder": iframePlaceholderStyles
                }),
                onFocusIframeCommunication: function () {
                    utils.fireEvent(this.$iframe.get(0), "iframefocusin", true, false);
                },
                onBlurIframeCommunication: function () {
                    utils.fireEvent(this.$iframe.get(0), "iframeblur", true, false);
                },
                onReady: function () {
                    var brandWrapper = document.querySelector("form.wpwl-form-card .wpwl-wrapper-brand");
                    if (brandWrapper) {
                        brandWrapper.style.display = "none";
                    }

                    var formRegistrationsWrapper = document.querySelector("div.wpwl-form-registrations");
                    if (formRegistrationsWrapper) {
                        formRegistrationsWrapper.parentNode.removeChild(formRegistrationsWrapper);
                    }

                    if (options.isStorable) {
                        var createRegistrationContainer = document.createElement("div");
                        createRegistrationContainer.className = "wpwl-group wpwl-group-createRegistration wpwl-clearfix";

                        var createRegistrationLabel = document.createElement("div");
                        createRegistrationLabel.className = "wpwl-label wpwl-label-createRegistration";

                        var createRegistrationWrapper = document.createElement("div");
                        createRegistrationWrapper.className = "wpwl-wrapper wpwl-wrapper-createRegistration";

                        var createRegistrationCheckboxWrapper = document.createElement("div");
                        createRegistrationCheckboxWrapper.className = "checkbox";

                        var createRegistrationCheckboxLabelWrapper = document.createElement("label");

                        var createRegistrationCheckbox = document.createElement("input");
                        createRegistrationCheckbox.type = "checkbox";
                        createRegistrationCheckbox.name = "createRegistration";
                        createRegistrationCheckbox.value = "true";
                        createRegistrationCheckbox.checked = true;

                        var isStorableCaption = options.isStorableCaption
                            ? document.createTextNode(options.isStorableCaption)
                            : l10n.translate("payment_form_store_payment_method");

                        createRegistrationCheckboxLabelWrapper.append(createRegistrationCheckbox);
                        createRegistrationCheckboxLabelWrapper.append(isStorableCaption);
                        createRegistrationCheckboxWrapper.append(createRegistrationCheckboxLabelWrapper);
                        createRegistrationWrapper.append(createRegistrationCheckboxWrapper);

                        createRegistrationContainer.append(createRegistrationLabel);
                        createRegistrationContainer.append(createRegistrationWrapper);

                        var group = document.querySelector("form.wpwl-form-card .wpwl-group-submit");
                        if (group) {
                            group.parentNode.insertBefore(createRegistrationContainer, group);
                        }

                        group = document.querySelector("form.wpwl-form-directDebit .wpwl-group-submit");
                        if (group) {
                            group.parentNode.insertBefore(createRegistrationContainer, group);
                        }
                    }

                    var submit = document.querySelector(".wpwl-button");
                    submit.className += " ignore-disable-on-submit";
                    if (paymentBrands[0].value !== "PAYPAL") {
                        submit.textContent = options.submitButtonTitle;
                    }

                    if (typeof options.onFormLoaded == "function") {
                        options.onFormLoaded();
                    }
                },
                onError: function (error) {
                    if (typeof options.onError == "function") {
                        options.onError(error.message, error);
                    }
                },
                onBeforeSubmitCard: createOnBeforeSubmitHandler(false, function () {
                    var cardHolderElement = document.querySelector(".wpwl-form-card .wpwl-control-cardHolder");
                    var cardHolder = cardHolderElement && cardHolderElement.value;

                    if (!cardHolder || !utils.validateStringForRestrictedSymbols(cardHolder)) {
                        var message = l10n.translate("validation_msg_card_holder");
                        addValidationError(cardHolderElement, message);

                        return false;
                    }

                    return true;
                }, {
                    "paymentBrand": ".wpwl-control-brand",
                    "expiryDate": ".wpwl-control-expiry",
                    "cardHolder": ".wpwl-control-cardHolder"
                }),
                onBeforeSubmitDirectDebit: createOnBeforeSubmitHandler(false, function () {
                    var ibanElement = document.querySelector(".wpwl-form-directDebit .wpwl-control-accountIban");
                    var iban = ibanElement && ibanElement.value;

                    var holderElement = document.querySelector(".wpwl-form-directDebit .wpwl-control-accountHolder");
                    var holder = holderElement && holderElement.value;

                    var isDataValid = true;

                    if (iban) {
                        var ibanCountry = iban.substring(0, 2).toUpperCase();
                        if (supportedIbanCountries.indexOf(ibanCountry) === -1) {
                            var ibanErrorMessage = l10n.translate("payment_form_invalid_iban_country");
                            addValidationError(ibanElement, ibanErrorMessage);

                            isDataValid = false;
                        }
                    }

                    if (holder && !utils.validateStringForRestrictedSymbols(holder)) {
                        var holderErrorMessage = l10n.translate("payment_form_invalid_account_holder");
                        addValidationError(holderElement, holderErrorMessage);

                        isDataValid = false;
                    }

                    return isDataValid;
                }, {
                    "accountHolder": ".wpwl-control-accountHolder",
                    "iban": ".wpwl-control-accountIban"
                }),
                onBeforeSubmitOnlineTransfer: createOnBeforeSubmitHandler(true),
                onBeforeSubmitVirtualAccount: createOnBeforeSubmitHandler(true)
            });


            var targetName = typeof options.targetName !== 'undefined'
                ? options.targetName
                : window !== window.top
                    ? window.name
                    : null;

			if (targetName) {
                utils.extend(wpwlOptions, {
                    paymentTarget: targetName,
                    shopperResultTarget: targetName
                });
            }

            // append custom css
            var style = document.createElement("style");
            style.type = 'text/css';
            style.appendChild(document.createTextNode(customCss));
            document.head.appendChild(style);

            // load static files async
            var scriptElement = document.createElement("script");
            scriptElement.src = utils.url(payonUrl, { checkoutId: options.authorizationToken });
            scriptElement.async = true;
            document.body.appendChild(scriptElement);

            return function () {
                window.wpwl.unload();
            };
        }

        function initCyberSource(target, options, useTokenEx) {
            if (!options.authorizationToken) {
                throw new Error("The 'authorizationToken' option is required.");
            }

            if (!Array.isArray(options.iframeCssUrls)) {
                throw new Error("The 'iframeCssUrls' option must be an array.");
            }

            if (!options.paymentProviderMode) {
                throw new Error("The 'paymentProviderMode' option is required.");
            }

            if (useTokenEx) {
                if (options.isStorable === undefined) {
                    options.isStorable = true;
                }

                try {
                    if (JSON.parse(atob(options.authorizationToken)).storeOptionMode) {
                        options.isStorable = false;
                    }
                }
                catch (e) {
                    throw new Error("The 'authorizationToken' option is not a Base64 encoded string or not valid JSON object.");
                }
            }

            return requestWebAPIPaymentForm(target, options, useTokenEx ? "cybersourcetokenex/paymentform" : "cybersource/paymentform",
                ["authorizationToken", "locale", "paymentOptionCodes", "paymentProviderMode", "isStorable", "isStorableCaption", "submitButtonTitle", "showLabels", "showPlaceholders", "iframeCss", "iframeCssUrls"],
                "CARDS");
        }

        function initVestaWithTokenEx(target, options) {
            if (!options.authorizationToken) {
                throw new Error("The 'authorizationToken' option is required.");
            }

            if (!Array.isArray(options.iframeCssUrls)) {
                throw new Error("The 'iframeCssUrls' option must be an array.");
            }

            if (!options.paymentProviderMode) {
                throw new Error("The 'paymentProviderMode' option is required.");
            }

            if (options.isStorable === undefined) {
                options.isStorable = true;
            }

            try {
                if (JSON.parse(atob(options.authorizationToken)).storeOptionMode) {
                    options.isStorable = false;
                }
            }
            catch (e) {
                throw new Error("The 'authorizationToken' option is not a Base64 encoded string or not valid JSON object.");
            }

            return requestWebAPIPaymentForm(target, options, "vesta/paymentform",
                ["authorizationToken", "locale", "paymentOptionCodes", "paymentProviderMode", "isStorable", "isStorableCaption", "submitButtonTitle", "showLabels", "showPlaceholders", "iframeCss", "iframeCssUrls"],
                "CARDS");
        }

        function initSepa(target, options) {
            if (!options.authorizationToken) {
                throw new Error("The 'authorizationToken' option is required.");
            }

            if (!Array.isArray(options.iframeCssUrls)) {
                throw new Error("The 'iframeCssUrls' option must be an array.");
            }

            try {
                JSON.parse(atob(options.authorizationToken));
            } catch (e) {
                throw new Error("The 'authorizationToken' option is not a Base64 encoded string or not valid JSON object.");
            }

            return requestWebAPIPaymentForm(target, options, "sepa/paymentform",
                ["authorizationToken", "locale", "submitButtonTitle", "showLabels", "showPlaceholders", "iframeCss", "iframeCssUrls"],
                "BANKS");
        }

        function initPayonWithPCIProxy(target, options) {
            if (!options.authorizationToken) {
                throw new Error("The 'authorizationToken' option is required.");
            }

            if (!Array.isArray(options.iframeCssUrls)) {
                throw new Error("The 'iframeCssUrls' option must be an array.");
            }

            try {
                JSON.parse(atob(options.authorizationToken));
            } catch (e) {
                throw new Error("The 'authorizationToken' option is not a Base64 encoded string or not valid JSON object.");
            }

            return requestWebAPIPaymentForm(target, options, "payonpciproxy/paymentform",
                ["authorizationToken", "locale", "paymentOptionCodes", "submitButtonTitle", "showLabels", "iframeCss", "iframeCssUrls"],
                "CARDS");
        }

        function initPayPal(target, options) {
            var paypalScript = document.createElement("script");
            paypalScript.type = "text/javascript";
            paypalScript.src = "https://www.paypalobjects.com/api/checkout.js";
            paypalScript.onload = function () {
                if (!this.readyState || this.readyState == "complete") {
                    var environment;
                    if (!options.paymentProviderMode) {
                        throw "paymentProviderMode required.";
                    }

                    switch (options.paymentProviderMode) {
                        case "live":
                            environment = paypal.ENV.PRODUCTION;
                            break;
                        case "test":
                            environment = paypal.ENV.SANDBOX;
                            break;
                        default:
                            throw "Invalid parameter value: paymentProviderMode.";
                    }

                    if (options.paypalButtonStyle && options.paypalButtonStyle.label && options.paypalButtonStyle.label === "credit") {
                        throw "Invalid parameter value: paypalButtonStyle. PayPal button label 'credit' value is not supported.";
                    }

                    var style = {
                        size: "small",
                        color: "gold",
                        shape: "pill",
                        label: "paypal",
                        tagline: false
                    };
                    utils.extend(style, options.paypalButtonStyle);

                    var locale = l10n.locale().replace("-", "_");
                    try {
                        paypal.Button.props.locale.validate(locale);
                    } catch (e) {
                        locale = "";
                    }

                    function OnCompleteArgs(data) {
                        var isRedirectPrevented = false;

                        this.preventRedirect = function () {
                            isRedirectPrevented = true;
                        }
                        this.isRedirectPrevented = function () {
                            return isRedirectPrevented;
                        }

                        this.getPaymentProviderData = function () {
                            return data;
                        }
                    }

                    paypal.Button.render({
                        env: environment,
                        commit: true,
                        locale: locale,
                        style: style,
                        payment: function (data, actions) {
                            if (typeof options.onBeforeSubmit == "function") {
                                options.onBeforeSubmit();
                            }

                            return options.authorizationToken;
                        },
                        onAuthorize: function (data, actions) {
                            var args = new OnCompleteArgs(data);

                            if (typeof options.onComplete == "function") {
                                options.onComplete(args);
                            }

                            if (!args.isRedirectPrevented()) {
                                actions.redirect();
                            }
                        },
                        onCancel: function (data, actions) {
                            var args = new OnCompleteArgs(data);

                            if (typeof options.onComplete == "function") {
                                options.onComplete(args);
                            }

                            if (!args.isRedirectPrevented()) {
                                actions.redirect();
                            }
                        },
                        onError: function (error) {
                            if (typeof options.onError == "function") {
                                options.onError(error.message, error);
                            }
                        },
                        onRender: function () {
                            if (typeof options.onFormLoaded == "function") {
                                options.onFormLoaded();
                            }
                        }
                    }, target);
                }
            };

            document.getElementsByTagName('head')[0].appendChild(paypalScript);
        }

        // options: 
        //  authorizationToken: string
        //  callbackUrl: string
        //  confirmationUrl: string
        //  iframeCss: string
        //  iframeCssUrls: string[]
        //  iframeStyles: object
        //  isStorable: boolean
        //  isStorableCaption: string
        //  locale: string // Obsolete
        //  onBeforeSubmit: function
        //  onError: function
        //  onFormLoaded: function
        //  paymentOptionCodes: string[]
        //  paymentProviderMode: string (live | test)
        //  paypalButtonStyle: object
        //  requireCvv: boolean
        //  showCVVHint: boolean
        //  showLabels: boolean
        //  showPlaceholders: boolean
        //  placeholdersColor: string
        //  submitButtonTitle: string
        //  targetName: string
        ns.PaymentForm = function (target, options) {
            if (!(target instanceof HTMLElement)) {
                throw new Error("Provided target is not a valid HTMLElement.");
            } else if (target instanceof HTMLFormElement) {
                throw new Error("HTMLFormElement cannot be used as target.");
            }

            if (!options) {
                throw new Error("options required.");
            }

            var paymentFormWrapper = document.createElement("div");
            paymentFormWrapper.style.visibility = "hidden";
            paymentFormWrapper.style.height = "100%";
            paymentFormWrapper.style.width = "100%";
            paymentFormWrapper.style.maxWidth = "100%";
            target.appendChild(paymentFormWrapper);

            if (typeof options.onFormLoaded == "function") {
                var originalOnFormLoaded = options.onFormLoaded;
                options.onFormLoaded = function () {
                    originalOnFormLoaded();
                    paymentFormWrapper.style.visibility = "visible";
                };
            } else {
                options.onFormLoaded = function () {
                    paymentFormWrapper.style.visibility = "visible";
                };
            }

            options = utils.extend({}, {
                showLabels: true,
                showPlaceholders: true,
                placeholdersColor: "#757575",
                showCVVHint: false,
                iframeCssUrls: []
            }, options);

            // Obsolete
            if (options.locale) {
                globalOptions.update({ locale: options.locale });
            }

            if (!Array.isArray(options.paymentOptionCodes) || options.paymentOptionCodes.length === 0) {
                throw new Error("Payment option codes is not a valid collection.");
            } else {
                options.paymentOptionCodes = globalOptions.removeUnsupportedPaymentOptionCodes(options.paymentOptionCodes);
            }

            var disposeCallbacks = [];

            switch (globalOptions.resolvePaymentProvider(options.paymentOptionCodes)) {
                case "CYBERSOURCE":
                    var disposeCallback = initCyberSource(paymentFormWrapper, options, false);
                    disposeCallbacks.push(disposeCallback);
                    break;

                case "CYBERSOURCEWITHTOKENEX":
                    var disposeCallback = initCyberSource(paymentFormWrapper, options, true);
                    disposeCallbacks.push(disposeCallback);
                    break;

                case "VESTAWITHTOKENEX":
                    var disposeCallback = initVestaWithTokenEx(paymentFormWrapper, options);
                    disposeCallbacks.push(disposeCallback);
                    break;

                case "PAYMENTSOS":
                    initPaymentsOs(paymentFormWrapper, options);
                    break;

                case "SEPA":
                    var disposeCallback = initSepa(paymentFormWrapper, options);
                    disposeCallbacks.push(disposeCallback);
                    break;

                case "PAYON":
                    var disposeCallback = initPayon(paymentFormWrapper, options);
                    if (disposeCallback) {
                        disposeCallbacks.push(disposeCallback);
                    }
                    break;

                case "PAYONWITHPCIPROXY":
                    var disposeCallback = initPayonWithPCIProxy(paymentFormWrapper, options);
                    disposeCallbacks.push(disposeCallback);
                    break;

                case "PAYPAL":
                    initPayPal(paymentFormWrapper, options);
                    break;

                default:
                    var errorMessage = "Payment provider cannot be resolved. Try to enable other payment providers, configure payment provider settings for the program and/or deactivate payment options that are not supported by the current configuration.\n" +
                        "Specified payment option codes: " + JSON.stringify(options.paymentOptionCodes) + "\n" +
                        "Supported payment option codes by enabled payment providers:\n";

                    globalOptions.getSupportedPaymentProviderPaymentOptions().forEach(function (provider) {
                        errorMessage = errorMessage + provider.code + ": " + JSON.stringify(provider.paymentOptionCodes) + "\n";
                    });

                    throw new Error(errorMessage);
            }

            return {
                dispose: function () {
                    for (var i = 0; i < disposeCallbacks.length; i++) {
                        disposeCallbacks[i]();
                    }
                }
            }
        };
    })();

    // Payment Confirmation
    (function () {
        // options: 
        //	paymentProviderMode: string (live | test)
        //	sessionIdentifier: string
        ns.PaymentConfirmation = function (form, options) {
            if (!form.tagName || form.tagName.toUpperCase() !== "FORM") {
                throw "Target is invalid. A form element is expected.";
            }

            function paymentConfirmationPayon(form, options) {
                var authorizationToken = utils.getParameterByName("authorizationToken");
                if (!authorizationToken) {
                    throw "Authorization token is not passed.";
                }

                var payonUrl;
                switch (options.paymentProviderMode) {
                    case "live":
                        payonUrl = "https://oppwa.com/v1/checkouts/" + authorizationToken + "/payment";
                        break;
                    case "test":
                        payonUrl = "https://test.oppwa.com/v1/checkouts/" + authorizationToken + "/payment";
                        break;
                    default:
                        throw "Invalid parameter value: paymentProviderMode.";
                }

                form.method = "POST";
                form.action = payonUrl;
            }

            function paymentConfirmationPayPal(form, options) {
                var flowIdentifier = "VOLKSWAGEN_9L76K46P4AH2W_PYMNT";

                var fraudNetScript = document.createElement("script");
                fraudNetScript.type = "application/json";
                fraudNetScript.fncls = "fnparams-dede7cc5-15fd-4c75-a9f4-36c430ee3a99";
                fraudNetScript.text = JSON.stringify({
                    "f": options.sessionIdentifier,
                    "s": flowIdentifier
                });
                form.appendChild(fraudNetScript);

                var fraudNetLoadScript = document.createElement("script");
                fraudNetLoadScript.type = "text/javascript";
                fraudNetLoadScript.text = "var scriptBaseURL = 'https://www.paypalobjects.com/webstatic/r/fb/'; \
                var dom, doc, where, iframe = document.createElement('iframe'); \
                iframe.src = \"about:blank\"; \
                iframe.title = \"\"; \
                iframe.role = \"presentation\"; \
                (iframe.frameElement || iframe).style.cssText = \"width:0;height:0; border:0\"; \
                where = document.getElementsByTagName('script'); \
                where = where[where.length - 1]; \
                where.parentNode.insertBefore(iframe, where); \
                try { \
                    doc = iframe.contentWindow.document; \
                } catch (e) { \
                    dom = document.domain; \
                    iframe.src = \"javascript:var d=document.open();d.domain='\" + dom + \"';void(0);\"; \
                    doc = iframe.contentWindow.document; \
                } \
                doc.open()._l = function () { \
                    var js = this.createElement(\"script\"); \
                    if (dom) { \
                        this.domain = dom; \
                    } \
                    js.id = \"js-iframe-async\"; \
                    js.src = scriptBaseURL + 'fb-all-prod.pp.min.js'; \
                    this.body.appendChild(js); \
                }; \
                doc.write('<body onload=\"document._l();\">');\
                doc.close();";
                form.appendChild(fraudNetLoadScript);

                var noscript = document.createElement("noscript");
                var img = document.createElement("img");
                img.src = "https://c.paypal.com/v1/r/d/b/ns?f=" + options.sessionIdentifier + "&s=" + flowIdentifier + "&js=0&r=1";
                noscript.appendChild(img);
                form.appendChild(noscript);
            }

            if (!options || !options.paymentProviderMode && !options.sessionIdentifier) {
                throw "options is not a valid collection.";
            }

            if (options.sessionIdentifier) {
                paymentConfirmationPayPal(form, options);
            } else {
                paymentConfirmationPayon(form, options);
            }
        };
    })();

    // User Agreement
    (function () {
        // options: 
        //  programCode: string
        //  mode: string('INITIAL'|'REPEATED')
        //  financialInstitutionName: string
        //  onLoad: function
        //	onError: function
        //	onAccept: function
        //	onBack: function
        //  fileName: string
        ns.UserAgreement = function (target, options) {
            if (!(target instanceof HTMLElement)) {
                throw "Invalid target.";
            }

            if (!options.programCode) {
                throw "Program Code parameter required.";
            }

            if (!options.mode) {
                throw "Mode parameter required.";
            }

            if (!options.financialInstitutionName) {
                throw "Financial Institution Name parameter is required.";
            }

            options = utils.extend({}, {

            }, options);

            var viewState = {
                userAgreementReference: null,
                text: null,
                isLoaded: false,
                isLoading: false,
                isAccepted: false
            }

            function updateViewState(newViewState) {
                utils.extend(viewState, newViewState);

                if (viewState.isLoading) {
                    agreementWrapperElement.classList.add("kc-user-agreement-loading");
                } else {
                    agreementWrapperElement.classList.remove("kc-user-agreement-loading");
                }

                if (viewState.isLoaded) {
                    if (viewState.isAccepted) {
                        acceptButtonElement.disabled = true;
                    } else {
                        acceptButtonElement.disabled = false;
                    }

                    agreementWrapperElement.classList.add("kc-user-agreement-loaded");
                } else {
                    acceptButtonElement.disabled = true;

                    agreementWrapperElement.classList.remove("kc-user-agreement-loaded");
                }
            }

            function back() {
                updateViewState({
                    isAccepted: false
                });

                if (typeof options.onBack === "function") {
                    options.onBack.call(null);
                }
            };

            function accept() {
                if (!viewState.isLoaded) {
                    throw new Error("User agreement has to be loaded before accepting.");
                }

                updateViewState({
                    isAccepted: true
                });

                if (typeof options.onAccept === "function") {
                    options.onAccept.call(null, viewState.userAgreementReference);
                }
            };

            function download() {
                load("PDF").complete({
                    success: function (data) {
                        utils.saveFile(data.fileData, options.fileName && options.fileName.length > 0 ? options.fileName : "user-agreement.pdf", "application/pdf");
                    }
                });
            };

            function load(formatType) {
                return apiHelper.get("userAgreement", apiHelper.createRequestObject(
                    {
                        culture: l10n.locale(),
                        programCode: options.programCode,
                        formatType: formatType || null
                    }));
            }

            this.load = function () {
                if (viewState.isLoading) {
                    return;
                }

                agreementTextElement.innerHTML = "";

                updateViewState({
                    isLoaded: false,
                    isLoading: true,
                    isAccepted: false,
                    isRead: false
                });

                load().complete({
                    success: function (data) {
                        updateViewState({
                            userAgreementReference: data.userAgreementReference,
                            text: data.text,
                            isLoaded: true,
                            isLoading: false
                        });

                        // data.text response property contains HTML markup be design and should be rendered without encoding.
                        agreementTextElement.innerHTML = data.text;

                        if (typeof options.onLoad === "function") {
                            options.onLoad.call(null);
                        }
                    },
                    error: function (data) {
                        updateViewState({
                            isLoading: false
                        });

                        if (typeof options.onError === "function") {
                            options.onError.call(null, data.responseDescription, data);
                        }
                    }
                });
            }

            var agreementWrapperElement;
            var agreementTextElement;
            var downloadAgreementTextElement;
            var backButtonElement;
            var acceptButtonElement;
            (function initForm(target, options) {
                agreementWrapperElement = document.createElement("div");
                agreementWrapperElement.className = "kc-user-agreement";
                target.appendChild(agreementWrapperElement);

                var header = document.createElement("div");
                header.className = "kc-user-agreement-header";
                agreementWrapperElement.appendChild(header);

                var content = document.createElement("div");
                content.className = "kc-user-agreement-content";
                agreementWrapperElement.appendChild(content);

                var footer = document.createElement("div");
                footer.className = "kc-user-agreement-footer";
                agreementWrapperElement.appendChild(footer);

                var loader = document.createElement("div");
                loader.className = "loader";
                agreementWrapperElement.appendChild(loader);

                var loaderInner = document.createElement("div");
                loaderInner.className = "loader-inner";
                loader.appendChild(loaderInner);

                var captionElement = document.createElement("span");
                captionElement.className = "kc-user-agreement-caption";
                header.appendChild(captionElement);

                agreementTextElement = document.createElement("div");
                agreementTextElement.className = "kc-user-agreement-text";
                agreementTextElement.appendChild(document.createTextNode(""));
                content.appendChild(agreementTextElement);

                downloadAgreementTextElement = document.createElement("a");
                downloadAgreementTextElement.className = "kc-user-agreement-text-download";
                downloadAgreementTextElement.appendChild(document.createTextNode(l10n.translate("user_agreement_widget_lnk_download")));
                content.appendChild(downloadAgreementTextElement);

                if (utils.detectBrowser(navigator.userAgent).safari) {
                    load("PDF").complete({
                        success: function (data) {
                            downloadAgreementTextElement.href = "data:application/pdf;base64," + data.fileData;
                            downloadAgreementTextElement.target = "_blank";
                            downloadAgreementTextElement.style.visibility = "visible";
                        }
                    });

                    downloadAgreementTextElement.style.visibility = "hidden";
                } else {
                    downloadAgreementTextElement.href = "#";
                    downloadAgreementTextElement.onclick = function (event) {
                        download();

                        event.preventDefault();
                    };
                }

                backButtonElement = document.createElement("button");
                backButtonElement.type = "button";
                backButtonElement.className = "kc-button kc-user-agreement-back-button";
                backButtonElement.appendChild(document.createTextNode(l10n.translate("user_agreement_widget_mode_btn_back")));
                backButtonElement.onclick = function () {
                    back();
                };
                footer.appendChild(backButtonElement);

                var checkBoxFormGroup = document.createElement("div");
                checkBoxFormGroup.className = "form-group";
                footer.appendChild(checkBoxFormGroup);

                var agreeCheckBoxWrapper = document.createElement("div");
                agreeCheckBoxWrapper.className = "checkbox";
                checkBoxFormGroup.appendChild(agreeCheckBoxWrapper);

                var agreeCheckBoxLabel = document.createElement("label");
                agreeCheckBoxWrapper.appendChild(agreeCheckBoxLabel);

                var agreeCheckBoxElement = document.createElement("input");
                agreeCheckBoxElement.type = "checkbox";
                agreeCheckBoxElement.name = "isAgree";
                agreeCheckBoxElement.setAttribute("data-val", "true");
                agreeCheckBoxElement.setAttribute("data-rule-required", "true");
                agreeCheckBoxElement.setAttribute("data-msg-required", l10n.translate("user_agreement_widget_agree_err_txt").replace("{0}", options.financialInstitutionName));
                agreeCheckBoxLabel.appendChild(agreeCheckBoxElement);
                var agreeCheckBoxText = document.createElement("span");
                agreeCheckBoxText.textContent = l10n.translate("user_agreement_widget_mode_chb_agree").replace("{0}", options.financialInstitutionName);
                agreeCheckBoxLabel.appendChild(agreeCheckBoxText);

                var agreeCheckBoxErrorLabel = document.createElement("span");
                agreeCheckBoxErrorLabel.className = "help-block error field-validation-valid";
                agreeCheckBoxErrorLabel.setAttribute("data-valmsg-replace", "true");
                agreeCheckBoxErrorLabel.setAttribute("data-valmsg-for", "isAgree");
                checkBoxFormGroup.appendChild(agreeCheckBoxErrorLabel);

                acceptButtonElement = document.createElement("button");
                acceptButtonElement.type = "button";
                acceptButtonElement.className = "kc-button kc-button-primary kc-user-agreement-accept-button";
                var acceptButtonText = options.mode === "REPEATED" ? l10n.translate("user_agreement_accept_button") : l10n.translate("user_agreement_widget_mode1_btn_close");
                acceptButtonElement.appendChild(document.createTextNode(acceptButtonText));
                acceptButtonElement.onclick = function () {
                    accept();
                };
                footer.appendChild(acceptButtonElement);
            })(target, options);

            this.load();
        };
    })();
})(window.cw = window.cw || {});