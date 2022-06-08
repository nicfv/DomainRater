'use strict';

/**
 * The entry point of the program.
 */
function main() {
    console.log('Loaded!');
    const DOMAIN_INPUT = document.getElementById('domain'),
        OUTPUT = document.getElementById('result');
    const update = domain => {
        const RATING = new DomainRater(domain);
        OUTPUT.innerText = RATING.getDomain() + '\n' +
            RATING.getPattern() + '\n\n' +
            'Score: ' + RATING.getScore() + '\n\n' +
            RATING.getMessages().join('\n');
        document.body.style.backgroundColor = 'hsl(' + clamp(translate(RATING.getScore(), 0, 1e3, 140, 0), 0, 120) + ',100%,45%)';
    };
    DOMAIN_INPUT.oninput = () => update(DOMAIN_INPUT.value);
    update('');
}
/**
 * Clamp `x` between `min` and `max`.
 */
function clamp(x, min, max) {
    if (typeof x === 'number' && typeof min === 'number' && typeof max === 'number') {
        return (x < min ? min : (x > max ? max : x));
    } else {
        throw 'Invalid parameter types.';
    }
}
/**
 * Normalize the number `x` between `min` and `max`.
 */
function normalize(x, min, max) {
    if (typeof x === 'number' && typeof min === 'number' && typeof max === 'number') {
        return (x - min) / (max - min);
    } else {
        throw 'Invalid parameter types.';
    }
}
/**
 * Expand the normalized number `x` between `min` and `max`.
 */
function expand(x, min, max) {
    if (typeof x === 'number' && typeof min === 'number' && typeof max === 'number') {
        return x * (max - min) + min;
    } else {
        throw 'Invalid parameter types.';
    }
}
/**
 * Translate a number `x` from the number line `a, b` to `c, d`
 */
const translate = (x, a, b, c, d) => expand(normalize(x, a, b), c, d);

window.onload = main;