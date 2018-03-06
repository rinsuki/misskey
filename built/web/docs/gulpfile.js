"use strict";
/**
 * Gulp tasks
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const gulp = require("gulp");
const pug = require("pug");
const mkdirp = require("mkdirp");
const stylus = require("gulp-stylus");
const cssnano = require("gulp-cssnano");
const i18n_1 = require("../../common/build/i18n");
const fa_1 = require("../../common/build/fa");
const vars_1 = require("./vars");
require('./api/gulpfile.ts');
gulp.task('doc', [
    'doc:docs',
    'doc:api',
    'doc:styles'
]);
gulp.task('doc:docs', async () => {
    const commonVars = await vars_1.default();
    glob('./src/web/docs/**/*.*.pug', (globErr, files) => {
        if (globErr) {
            console.error(globErr);
            return;
        }
        files.forEach(file => {
            const [, name, lang] = file.match(/docs\/(.+?)\.(.+?)\.pug$/);
            const vars = {
                common: commonVars,
                lang: lang,
                title: fs.readFileSync(file, 'utf-8').match(/^h1 (.+?)\r?\n/)[1],
                src: `https://github.com/syuilo/misskey/tree/master/src/web/docs/${name}.${lang}.pug`,
            };
            pug.renderFile(file, vars, (renderErr, content) => {
                if (renderErr) {
                    console.error(renderErr);
                    return;
                }
                pug.renderFile('./src/web/docs/layout.pug', Object.assign({}, vars, {
                    content
                }), (renderErr2, html) => {
                    if (renderErr2) {
                        console.error(renderErr2);
                        return;
                    }
                    const i18n = new i18n_1.default(lang);
                    html = html.replace(i18n.pattern, i18n.replacement);
                    html = fa_1.default(html);
                    const htmlPath = `./built/web/docs/${lang}/${name}.html`;
                    mkdirp(path.dirname(htmlPath), (mkdirErr) => {
                        if (mkdirErr) {
                            console.error(mkdirErr);
                            return;
                        }
                        fs.writeFileSync(htmlPath, html, 'utf-8');
                    });
                });
            });
        });
    });
});
gulp.task('doc:styles', () => gulp.src('./src/web/docs/**/*.styl')
    .pipe(stylus())
    .pipe(cssnano())
    .pipe(gulp.dest('./built/web/docs/assets/')));
