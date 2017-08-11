/*
 * Bootstrap gulp
 */
import gulp from 'gulp';
import { packageOptions, gulpOptions, taskConfig } from '../gulpfile.babel.js';
import * as utilities from './bootstrap/utilities';
import * as manifest from './bootstrap/manifest';

/*
 * Add specific modules
 */
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import merge from 'merge-stream';

/*
 * Task: Concat all JavaScript and minify it
 */
function scripts() {
    var revManifest = manifest.get();

    let tasks = taskConfig.scripts.map(task => {
        revManifest = manifest.checkFile(revManifest, task.saveto, task.filename);

        return gulp.src(task.src, gulpOptions.src)
            .on('end', utilities.logBegin('Scripts'))
            .pipe(utilities.initSourceMaps())
            .pipe(concat(task.filename))
            .pipe(
                uglify(packageOptions.uglify).on('error', function(error) {
                    var stream = this;

                    utilities.onError(stream, error, error.cause.message, error.cause.filename);
                })
            )
            .pipe(utilities.writeSourceMaps())
            .on('end', utilities.logEnd(task))
            .pipe(gulp.dest(task.saveto));
    });

    manifest.update(revManifest);

    return merge(tasks);
}

export { scripts };
