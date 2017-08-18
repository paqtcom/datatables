/*
 * Bootstrap gulp
 */
import gulp from 'gulp';
import { folders, packageOptions, gulpOptions, taskConfig } from '../gulpfile.babel.js';
import * as utilities from './bootstrap/utilities';
import * as manifest from './bootstrap/manifest';

/*
 * Add specific modules
 */
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import merge from 'merge-stream';

/*
 * Task: Compile and transpile scss to css
 */
function styles() {
    var revManifest = manifest.get();

    let tasks = taskConfig.styles.map(task => {
        revManifest = manifest.checkFile(revManifest, task.saveto, task.filename);

        return gulp.src(task.src, gulpOptions.src)
                .on('end', utilities.logBegin('Styles'))
                .pipe(utilities.initSourceMaps())
                .pipe(
                    sass({
                        includePaths: [folders.npm]
                    }).on('error', function(error) {
                        var stream = this;

                        utilities.onError(stream, error, error.messageOriginal, error.relativePath);
                    })
                )
                .pipe(cleanCSS())
                .pipe(postcss([
                    autoprefixer()
                ]))
                .pipe(utilities.writeSourceMaps())
                .on('end', utilities.logEnd(task))
                .pipe(gulp.dest(task.saveto));
    });

    manifest.update(revManifest);

    return merge(tasks);
}

export { styles };
