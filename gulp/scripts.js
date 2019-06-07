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
import babel from 'gulp-babel';

/*
 * Task: Concat all JavaScript and minify it
 */
function scripts() {
    var revManifest = manifest.get();

    let tasks = taskConfig.scripts.map(task => {
        revManifest = manifest.checkFile(revManifest, task.saveto, task.filename);

        let gulpTask = gulp
            .src(task.src, gulpOptions.src)
            .on('end', utilities.logBegin('Scripts'))
            .pipe(utilities.initSourceMaps());

        if (task.filename !== 'vendor.js') {
            // non vendor scripts with babel
            gulpTask = gulpTask.pipe(babel());
        }

        return gulpTask
            .pipe(concat(task.filename))
            .pipe(uglify())
            .pipe(utilities.writeSourceMaps())
            .on('end', utilities.logEnd(task))
            .pipe(gulp.dest(task.saveto));
    });

    manifest.update(revManifest);

    return merge(tasks);
}

export { scripts };
