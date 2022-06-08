'use strict';
/**
 * Represents a domain name rating system.
 */
class DomainRater {
    #domain;
    #score;
    #messages;
    /**
     * Rate a new domain name by constructing a new `DomainRater` system. Overwrites previous messages and score.
     */
    constructor(domain) {
        this.#domain = new Domain(domain);
        this.#score = 0;
        this.#messages = [];
        if (this.#domain.isValid()) {
            this.#addHeader(this.#domain.getDomainWithoutDirectory());
            this.#rateProtocol();
            this.#rateSubDomain();
            this.#rateMainDomain();
            this.#rateTLD();
        } else {
            this.#addHeader('Invalid domain name pattern.');
        }
    }
    /**
     * Return the domain name associated with this rating.
     */
    getDomain() {
        if (this.#domain.isValid()) {
            return this.#domain.getApexDomain();
        } else {
            return 'Invalid domain.';
        }
    }
    /**
     * Return the numerical value for the score of this domain.
     */
    getScore() {
        return this.#score;
    }
    /**
     * Return the array of detail messages for this domain.
     */
    getMessages() {
        return this.#messages;
    }
    /**
     * Get the apex domain pattern.
     */
    getPattern() {
        if (this.#domain.isValid()) {
            if (this.#domain.getMainDomain().match(/^[A-Z]+$/i)) {
                return this.#domain.getMainDomain().length + 'L.' + this.#domain.getTLD();
            } else if (this.#domain.getMainDomain().match(/^[0-9]+$/i)) {
                return this.#domain.getMainDomain().length + 'N.' + this.#domain.getTLD();
            } else {
                return this.#domain.getMainDomain().replace(/[A-Z]/gi, 'L').replace(/[0-9]/gi, 'N') + '.' + this.#domain.getTLD();
            }
        } else {
            return 'Invalid domain.';
        }
    }
    /**
     * Add a header message.
     */
    #addHeader(message) {
        if (typeof message === 'string') {
            this.#messages.push('');
            this.#messages.push(message);
            this.#messages.push('');
        } else {
            throw 'Invalid parameter types.';
        }
    }
    /**
     * Add a message to the list of messages and optionally change the score of this domain.
     */
    #addMessage(message, scoreChange = 0) {
        if (typeof scoreChange === 'number' && typeof message === 'string') {
            this.#score += scoreChange;
            this.#messages.push('\t[' + (scoreChange >= 0 ? '+' : '') + scoreChange + '] ' + message);
        } else {
            throw 'Invalid parameter types.';
        }
    }
    #rateProtocol() {
        this.#addHeader('Domain Protocol (' + this.#domain.getProtocol() + ')');
        switch (this.#domain.getProtocol()) {
            case (''): {
                this.#addMessage('No web protocol specified.');
                break;
            }
            case ('http'): {
                this.#addMessage('Unsecured connection protocol.', 5);
                break;
            }
            case ('https'): {
                this.#addMessage('Secured connection protocol.', 0);
                break;
            }
            case ('ftp'): {
                this.#addMessage('File transfer protocol.', 0);
                break;
            }
            default: {
                this.#addMessage('Unknown protocol.');
            }
        }
    }
    #rateName(name) {
        if (typeof name === 'string') {
            this.#addMessage('Length of ' + name + ': ' + name.length + ' characters', name.length ** 2);
            if (name[0] === '-' || name[name.length - 1] === '-') {
                this.#addMessage('Invalid identifier. Cannot start or end with a hyphen!');
            }
            const VOWELS = /[aeiouy]{3,}/ig,
                CONSONANTS = /[bcdfghjklmnpqrstvwxz]{3,}/ig,
                MATCH_VOWELS = [...name.matchAll(VOWELS)].map(x => x[0]),
                MATCH_CONSONANTS = [...name.matchAll(CONSONANTS)].map(x => x[0]),
                CHEAP = /[etaoinshrdl]/ig,
                MEDIUM = /[cumwfgyp]/ig,
                EXPENSIVE = /[bvkxjqz]/ig,
                SPECIAL = /[0-9\-]/ig,
                COUNT_CHEAP = [...name.matchAll(CHEAP)].length,
                COUNT_MEDIUM = [...name.matchAll(MEDIUM)].length,
                COUNT_EXPENSIVE = [...name.matchAll(EXPENSIVE)].length,
                COUNT_SPECIAL = [...name.matchAll(SPECIAL)].length;
            if (!!MATCH_VOWELS.length) {
                this.#addMessage(MATCH_VOWELS.length + ' groups of 3 or more vowels: ' + MATCH_VOWELS.join(', '), 10 * MATCH_VOWELS.length);
                for (let match in MATCH_VOWELS) {
                    this.#addMessage(MATCH_VOWELS[match].length + ' vowels in sequence: ' + MATCH_VOWELS[match], 5 * MATCH_VOWELS[match].length);
                }
            }
            if (!!MATCH_CONSONANTS.length) {
                this.#addMessage(MATCH_CONSONANTS.length + ' groups of 3 or more consonants: ' + MATCH_CONSONANTS.join(', '), 10 * MATCH_CONSONANTS.length);
                for (let match in MATCH_CONSONANTS) {
                    this.#addMessage(MATCH_CONSONANTS[match].length + ' consonants in sequence: ' + MATCH_CONSONANTS[match], 5 * MATCH_CONSONANTS[match].length);
                }
            }
            if (COUNT_CHEAP) {
                this.#addMessage(COUNT_CHEAP + ' characters from ' + CHEAP.source, 10 * COUNT_CHEAP);
            }
            if (COUNT_MEDIUM) {
                this.#addMessage(COUNT_MEDIUM + ' characters from ' + MEDIUM.source, 15 * COUNT_MEDIUM);
            }
            if (COUNT_EXPENSIVE) {
                this.#addMessage(COUNT_EXPENSIVE + ' characters from ' + EXPENSIVE.source, 20 * COUNT_EXPENSIVE);
            }
            if (COUNT_SPECIAL) {
                this.#addMessage(COUNT_SPECIAL + ' numbers and hyphens', 20 * COUNT_SPECIAL);
            }
        } else {
            throw 'Invalid parameter types.';
        }
    }
    #rateSubDomain() {
        this.#addHeader('Subdomain (' + this.#domain.getSubDomain() + ')');
        switch (this.#domain.getSubDomain()) {
            case (''): {
                this.#addMessage('There is no subdomain.');
                break;
            }
            case ('www'): {
                this.#addMessage('Default subdomain.');
                break;
            }
            default: {
                const PARTS = this.#domain.getSubDomain().split('.');
                for (let i in PARTS) {
                    if (PARTS[i]) {
                        this.#rateName(PARTS[i]);
                    } else {
                        this.#addMessage('Malformed subdomain.');
                    }
                }
            }
        }
    }
    #rateMainDomain() {
        this.#addHeader('Main Domain (' + this.#domain.getMainDomain() + ')');
        this.#rateName(this.#domain.getMainDomain());
    }
    #rateTLD() {
        this.#addHeader('Top Level Domain (' + this.#domain.getTLD() + ')');
        this.#addMessage('Number of characters in TLD', this.#domain.getTLD().length);
        switch (this.#domain.getTLD()) {
            case ('com'): {
                this.#addMessage('Extremely well-known commercial TLD with a long reputation. Highly desirable.', 0);
                break;
            }
            case ('net'):
            case ('org'): {
                this.#addMessage('Well-known network or organization TLD. Desirable.', 5);
                break;
            }
            case ('edu'):
            case ('gov'):
            case ('mil'):
            case ('int'): {
                this.#addMessage('Official governmental or educational TLD. Highly desirable, but only issued by the US government.', 0);
                break;
            }
            case ('au'): // Australia
            case ('br'): // Brazil
            case ('ca'): // Canada
            case ('eu'): // European Union
            case ('fr'): // France
            case ('ie'): // Ireland
            case ('it'): // Italy
            case ('mc'): // Monaco
            case ('mg'): // Madagascar
            case ('mo'): // Macau
            case ('my'): // Malaysia
            case ('no'): // Norway
            case ('re'): // Reunion
            case ('sa'): // Saudi Arabia
            case ('sk'): // Slovakia
            case ('sm'): // San Marino
            case ('ua'): // Ukraine
            case ('uk'): // United Kingdom
            case ('us'): // United States
            case ('va'): {// Vatican City
                this.#addMessage('Country-level TLD with some restrictions. Usually these are safe and reputable.', 10);
                break;
            }
            default: {
                if (this.#domain.getTLD().length === 2) {
                    this.#addMessage('Country-level TLD with few or no restrictions. These often are marked as spam websites.', 35);
                } else {
                    this.#addMessage('Fun or unknown TLD. Not desirable as these websites may be flagged as spam by some search engines.', 45);
                }
            }
        }
    }
}
/**
 * Represents a web domain.
 */
class Domain {
    #valid;
    #completeDomain;
    #protocol;
    #subDomain;
    #mainDomain;
    #tld;
    #directory;
    /**
     * Parses a domain from a raw string.
     */
    constructor(domain) {
        if (typeof domain === 'string') {
            const MATCH_EXP = /^(([A-Z]+):\/\/)?(([A-Z0-9\-\.]+)\.)?([A-Z0-9\-]+)\.([A-Z0-9\-]+)(\/.*)?$/i,
                MATCH_FOUND = domain.match(MATCH_EXP);
            if (MATCH_FOUND) {
                this.#valid = true;
                this.#completeDomain = MATCH_FOUND[0] ?? '';
                this.#protocol = (MATCH_FOUND[2] ?? '').toLowerCase();
                this.#subDomain = (MATCH_FOUND[4] ?? '').toLowerCase();
                this.#mainDomain = (MATCH_FOUND[5] ?? '').toLowerCase();
                this.#tld = (MATCH_FOUND[6] ?? '').toLowerCase();
                this.#directory = MATCH_FOUND[7] ?? '';
            } else {
                this.#valid = false;
            }
        } else {
            throw 'Domain must be of type string but was of type ' + typeof domain + '.';
        }
    }
    /**
     * Determines whether the domain entered is a valid domain or not.
     */
    isValid() {
        return this.#valid;
    }
    /**
     * Returns the complete domain that was parsed.
     */
    getCompleteDomain() {
        return this.#completeDomain;
    }
    /**
     * Returns the protocol associated with this domain. May return an empty string.
     */
    getProtocol() {
        return this.#protocol;
    }
    /**
     * Returns the subdomain associated with this domain. May return an empty string.
     */
    getSubDomain() {
        return this.#subDomain;
    }
    /**
     * Returns the main domain associated with this domain.
     */
    getMainDomain() {
        return this.#mainDomain;
    }
    /**
     * Returns the top level domain (TLD) of this domain.
     */
    getTLD() {
        return this.#tld;
    }
    /**
     * Returns the directory, typically if a URL was pasted. May return an empty string.
     */
    getDirectory() {
        return this.#directory;
    }
    /**
     * Return the apex domain. Example: `example.com`
     */
    getApexDomain() {
        return this.#mainDomain + '.' + this.#tld;
    }
    /**
     * Return the full domain without the proceeding forward slash or directory.
     */
    getDomainWithoutDirectory() {
        return this.#protocol + (this.#protocol ? '://' : '') + this.#subDomain + (this.#subDomain ? '.' : '') + this.getApexDomain();
    }
}