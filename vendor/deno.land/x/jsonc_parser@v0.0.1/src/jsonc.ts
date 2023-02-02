function parse(text: string, reviver?: ((this: any, key: string, value: any) => any)): any {
    const lines = text.split('\n');
    const linesNoComment: string[] = [];
    let inBlockComment = false;
    for (let line of lines) {
        let inString = false;
        for (let i = 0, len = line.length; i < len; i++) {
            const char = line[i];
            const isLastChar = i === len -1;
            if (char === '\\') {
                i++;

            } else if (inString) {
                if (char === '"') {
                    inString = false;
                }

            } else if (inBlockComment) {
                if (char == '*' && !isLastChar && line[i + 1] === '/') {
                    inBlockComment = false;
                    line = line.substr(0, i) + '  ' + line.substr(i + 2);
                    i++;
                } else {
                    line = line.substr(0, i) + ' ' + line.substr(i + 1);
                }

            } else if (char === '"') {
                inString = true;

            } else {
                // LINE COMMENT
                if (char === '/' && !isLastChar && line[i + 1] === '/') {
                    line = line.substr(0, i);
                    break;
                }

                // BLOCK COMMENT
                if (char == '/' && !isLastChar && line[i + 1] === '*') {
                    inBlockComment = true;
                    line = line.substr(0, i) + '  ' + line.substr(i + 2);
                    i++;
                }
            }
        }
        linesNoComment.push(line);
    }
    return JSON.parse(linesNoComment.join(''), reviver);
}

export const JSONC = { parse };
