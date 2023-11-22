// @ts-expect-error when @types/node is updated, this should be fixed
import {compose} from "node:stream";

// original from https://github.com/xpl/ansicolor

const colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'] as const;
const colorCodesLight = [
    'darkGray',
    'lightRed',
    'lightGreen',
    'lightYellow',
    'lightBlue',
    'lightMagenta',
    'lightCyan',
    'white',
    ''
] as const;
const styleCodes = ['', 'bright', 'dim', 'italic', 'underline', '', '', 'inverse'] as const;
const asBright = {
    red: 'lightRed',
    green: 'lightGreen',
    yellow: 'lightYellow',
    blue: 'lightBlue',
    magenta: 'lightMagenta',
    cyan: 'lightCyan',
    black: 'darkGray',
    lightGray: 'white'
} as const;
const types = {0: 'style', 2: 'unstyle', 3: 'color', 9: 'colorLight', 4: 'bgColor', 10: 'bgColorLight'} as const;
const subtypes = {
    color: colorCodes,
    colorLight: colorCodesLight,
    bgColor: colorCodes,
    bgColorLight: colorCodesLight,
    style: styleCodes,
    unstyle: styleCodes
} as const;


const RGB = {
    black: [0, 0, 0],
    darkGray: [100, 100, 100],
    lightGray: [200, 200, 200],
    white: [255, 255, 255],

    red: [204, 0, 0],
    lightRed: [255, 51, 0],

    green: [0, 204, 0],
    lightGreen: [51, 204, 51],

    yellow: [204, 102, 0],
    lightYellow: [255, 153, 51],

    blue: [0, 0, 255],
    lightBlue: [26, 140, 255],

    magenta: [204, 0, 204],
    lightMagenta: [255, 0, 255],

    cyan: [0, 153, 255],
    lightCyan: [0, 204, 255]
} as const;

interface CleanColor {
    name: string;
    bright: boolean;
    dim: boolean;
}

class Color {
    background: boolean;
    name: string;
    brightness: number;

    constructor(background?: boolean, name?: string, brightness?: number) {
        this.background = background;
        this.name = name;
        this.brightness = brightness;
    }

    get inverse() {
        return new Color(!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness);
    }

    get clean(): CleanColor | undefined {
        const name = this.name === 'default' ? '' : this.name;
        const bright = this.brightness === Code.bright;
        const dim = this.brightness === Code.dim;

        if (!name && !bright && !dim) {
            return undefined;
        }

        return {
            name,
            bright,
            dim
        };
    }

    defaultBrightness(value?: number) {
        return new Color(this.background, this.name, this.brightness || value);
    }

    css(inverted: boolean) {
        const color = inverted ? this.inverse : this;

        const rgbName = (color.brightness === Code.bright && asBright[color.name as keyof typeof asBright]) || color.name;

        const prop = color.background ? 'background:' : 'color:',
            rgb = RGB[rgbName as keyof typeof RGB],
            alpha = this.brightness === Code.dim ? 0.5 : 1;

        return rgb
            ? prop + 'rgba(' + [...rgb, alpha].join(',') + ');'
            : !color.background && alpha < 1
                ? 'color:rgba(0,0,0,0.5);'
                : ''; // Chrome does not support 'opacity' property...
    }
}

/*  ------------------------------------------------------------------------ */

class Code {

    static reset = 0;
    static bright = 1;
    static dim = 2;
    static inverse = 7;
    static noBrightness = 22;
    static noItalic = 23;
    static noUnderline = 24;
    static noInverse = 27;
    static noColor = 39;
    static noBgColor = 49;

    value: number;
    type: string;
    subtype: string;
    str: string;
    isBrightness: boolean;

    constructor(n?: string) {
        let value = undefined;
        let type = undefined;
        let subtype = undefined;
        let str = '';
        let isBrightness = false;

        if (n !== undefined) {
            value = Number(n);
            type = types[Math.floor(value / 10) as keyof typeof types];
            subtype = subtypes[type as keyof typeof subtypes][value % 10];
            str = '\u001b[' + value + 'm';
            isBrightness = value === Code.noBrightness || value === Code.bright || value === Code.dim;
        }

        this.value = value;
        this.type = type;
        this.subtype = subtype;
        this.str = str;
        this.isBrightness = isBrightness;
    }

    static str(x?: string) {
        if (x === undefined) return '';
        return '\u001b[' + Number(x) + 'm';
    }

    clone() {
        const newCode = new Code(undefined);
        newCode.value = this.value;
        newCode.type = this.type;
        newCode.subtype = this.subtype;
        newCode.str = this.str;
        newCode.isBrightness = this.isBrightness;
        return newCode;
    }
}


const TEXT = 0;
const BRACKET = 1;
const CODE = 2;

export class Span {
    code: Code;
    text: string;
    css: string;
    color: CleanColor;
    bgColor: CleanColor;
    bold: boolean;
    inverse: boolean;
    italic: boolean;
    underline: boolean;
    bright: boolean;
    dim: boolean;

    constructor(code: Code, text: string) {
        this.code = code;
        this.text = text;

        // Those are added in the actual parse, this is done for performance reasons to have the same hidden class
        this.css = '';
        this.color = undefined;
        this.bgColor = undefined;
        this.bold = undefined;
        this.inverse = undefined;
        this.italic = undefined;
        this.underline = undefined;
        this.bright = undefined;
        this.dim = undefined;
    }
}

interface State {
    state: typeof TEXT | typeof BRACKET | typeof CODE;
    buffer: string;
    text: string;
    code: string;
    codes: Code[];
}

// getString as function instead of string to allow garbage collection
export async function* rawParse(iterator: AsyncIterableIterator<Buffer>) {
    const stateObject: State = {
        state: TEXT,
        buffer: '',
        text: '',
        code: '',
        codes: []
    };


    for await (const chunk of iterator) {
        const chars = chunk.toString();
        const charsLength = chunk.length;

        for (let i = 0; i < charsLength; i++) {
            const c = chars[i];

            stateObject.buffer += c;

            switch (stateObject.state) {
                case TEXT:
                    if (c === '\u001b') {
                        stateObject.state = BRACKET;
                        stateObject.buffer = c;
                    } else {
                        stateObject.text += c;
                    }
                    break;

                case BRACKET:
                    if (c === '[') {
                        stateObject.state = CODE;
                        stateObject.code = '';
                        stateObject.codes = [];
                    } else {
                        stateObject.state = TEXT;
                        stateObject.text += stateObject.buffer;
                    }
                    break;

                case CODE:
                    if (c >= '0' && c <= '9') {
                        stateObject.code += c;
                    } else if (c === ';') {
                        stateObject.codes.push(new Code(stateObject.code));
                        stateObject.code = '';
                    } else if (c === 'm') {
                        stateObject.code = stateObject.code || '0';
                        for (const code of stateObject.codes) {
                            yield new Span(code, stateObject.text);
                            stateObject.text = '';
                        }

                        yield new Span(new Code(stateObject.code), stateObject.text);
                        stateObject.text = '';
                        stateObject.state = TEXT;
                    } else {
                        stateObject.state = TEXT;
                        stateObject.text += stateObject.buffer;
                    }
            }
        }
    }

    if (stateObject.state !== TEXT) stateObject.text += stateObject.buffer;

    if (stateObject.text) {
        yield new Span(new Code(), stateObject.text);
    }
}


/**
 * Parse ansi text
 * @param {Generator<Span, void, *>} rawSpansIterator raw spans iterator
 * @return {Generator<Span, void, *>}
 */
export async function* parseAnsiFromRawSpans(rawSpansIterator: AsyncGenerator<Span, void, any>): AsyncGenerator<Span, void, any> {
    let color = new Color();
    let bgColor = new Color(true /* background */);
    let brightness = undefined;
    const styles = new Set();

    function reset() {
        color = new Color();
        bgColor = new Color(true /* background */);
        brightness = undefined;
        styles.clear();
    }

    reset();

    for await (const span of rawSpansIterator) {
        const c = span.code;

        if (span.text !== '') {
            const inverted = styles.has('inverse');
            const underline = styles.has('underline') ? 'text-decoration: underline;' : '';
            const italic = styles.has('italic') ? 'font-style: italic;' : '';
            const bold = brightness === Code.bright ? 'font-weight: bold;' : '';

            const foreColor = color.defaultBrightness(brightness);

            const newSpan = new Span(span.code ? span.code.clone() : undefined, span.text);

            newSpan.css = span.css ? span.css : bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted);
            newSpan.bold = span.bold ? span.bold : !!bold;
            newSpan.color = span.color ? span.color : foreColor.clean;
            newSpan.bgColor = span.bgColor ? span.bgColor : bgColor.clean;
            newSpan.inverse = inverted;
            newSpan.italic = !!italic;
            newSpan.underline = !!underline;
            newSpan.bright = styles.has('bright');
            newSpan.dim = styles.has('dim');

            yield newSpan;
        }

        if (c.isBrightness) {
            brightness = c.value;
            continue;
        }

        if (span.code.value === undefined) {
            continue;
        }

        if (span.code.value === Code.reset) {
            reset();
            continue;
        }

        switch (span.code.type) {
            case 'color':
            case 'colorLight':
                color = new Color(false, c.subtype);
                break;

            case 'bgColor':
            case 'bgColorLight':
                bgColor = new Color(true, c.subtype);
                break;

            case 'style':
                styles.add(c.subtype);
                break;
            case 'unstyle':
                styles.delete(c.subtype);
                break;
        }
    }
}

export function parseAnsiTransformer() {
    return compose(
        rawParse,
        parseAnsiFromRawSpans
    );
}
