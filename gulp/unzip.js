var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');
var unzip = require('gulp-unzip');
var gunzip = require('gulp-gunzip');
var untar = require('gulp-untar');
var fs = require('fs');

var fileBasePath = './downloads/nwjs-v0.13.1-';

gulp.task('unzipWindows',function() {
    var endFileName = 'win-x64.zip';
    gulp.src(fileBasePath + endFileName)
        .pipe(unzip())
        .pipe(gulp.dest('./cache'))
});

gulp.task('unzipWindowsSDK',function() {
    var endFileName = 'win-x64.zip';
    gulp.src('./downloads/nwjs-sdk-v0.13.1-win-x64.zip')
        .pipe(unzip())
        .pipe(gulp.dest('./cache'))
});

gulp.task('unzipOSX',function() {
    var endFileName = 'osx-x64.zip';
    gulp.src(fileBasePath + endFileName)
        .pipe(unzip())
        .pipe(gulp.dest('./cache'))
});

gulp.task('unzipLinux',function() {
    var endFileName = 'linux-x64.tar.gz';

    return gulp.src(fileBasePath + endFileName)
        .pipe(gunzip())
        .pipe(untar())
        .pipe(gulp.dest('./cache'))
});

gulp.task('correctWindows',function() {
    if (!fs.existsSync('./cache/nwjs-v0.13.1-win-x64/locales/fr.pak')) {
        gulp.src(['./cache/nwjs-sdk-v0.13.1-win-x64/locales/**.*'
        ]).pipe(gulp.dest('./cache/nwjs-v0.13.1-win-x64/locales'));
    }
});

gulp.task('correctLinux',function() {
    if (!fs.existsSync('./cache/downloads/nwjs-v0.13.1-linux-x64/locales/fr.pak')) {
        gulp.src(['./cache/nwjs-sdk-v0.13.1-win-x64/locales/**.*'
        ]).pipe(gulp.dest('./cache/downloads/nwjs-v0.13.1-linux-x64/locales'));
    }
});

gulp.task('unzipAll',gulpSequence(['unzipWindows', 'unzipWindowsSDK','unzipLinux']));
