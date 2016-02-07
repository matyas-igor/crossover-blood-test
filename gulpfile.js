var fs = require('fs');
var replace = require('gulp-replace');
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var ts = require('gulp-typescript');
var less = require('gulp-less');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

var argv = require('yargs').argv;
GLOBAL.__environment = argv.environment || argv.e || 'development';
var nconf = require('nconf');
nconf.argv().env().file({file: './config/'+__environment+'.json'});

// Dynamic server
gulp.task('browser-sync', function(done) {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
    done();
});

gulp.task('compile', function(){

    return gulp.src('./public/app/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts({
            "target": "es5",
            "module": "system",
            "moduleResolution": "node",
            "sourceMap": true,
            "emitDecoratorMetadata": true,
            "experimentalDecorators": true,
            "removeComments": false,
            "noImplicitAny": false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/build'));
});

gulp.task('less', function(){
    return gulp.src('./public/app/styles/**/*.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(concat('styles.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/build/styles'));
});


gulp.task('setup', function(done) {
    gulp.src([
        'node_modules/angular2/bundles/angular2-*.js*',
        'node_modules/angular2/bundles/angular2.*.js*',
        'node_modules/angular2/bundles/angular2-polyfills.*.js*',
        'node_modules/angular2/bundles/http.*.js*',
        'node_modules/angular2/bundles/router.*.js*',
        'node_modules/es6-shim/es6-shim.min.js*',
        'node_modules/socket.io-client/socket.io.js*',
        'node_modules/systemjs/dist/*.*',
        'node_modules/rxjs/bundles/Rx.js'
    ]).pipe(gulp.dest('./public/vendor/lib'));

    gulp.src([
        'node_modules/bootstrap/dist/css/bootstrap.css'
    ]).pipe(gulp.dest('./public/vendor/css'));

    var config = fs.readFileSync('./config/'+__environment+'.json');
    gulp.src(['./public/app/config.js'])
            .pipe(replace('{"INSERT":"ENVIRONMENT"}', JSON.stringify(__environment)))
            .pipe(replace('{"INSERT":"CONFIG"}', config))
            .pipe(gulp.dest("./public/build"));

    done();
});

gulp.task('watch:ts', ['compile'], function() {
    gulp.watch('./public/app/**/*.ts', ['compile']);
});
gulp.task('watch:less', ['less'], function() {
    gulp.watch('./public/app/styles**/*.less', ['less']);
});