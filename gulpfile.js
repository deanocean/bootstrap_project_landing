const gulp = require("gulp");
const $ = require('gulp-load-plugins')();
const jade = require('gulp-jade');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
var minimist = require('minimist');
var gulpif = require('gulp-if');
var clean = require('gulp-clean');
var gulpSequence = require('gulp-sequence');
const imagemin = require('gulp-imagemin');
var ghPages = require('gulp-gh-pages');
var data = require('gulp-data');

const envOptions = {
  string: 'env',
  default: { env: 'develop' }
}
const options = minimist(process.argv.slice(2), envOptions);
console.log(options)

gulp.task('clean', function () {
  return gulp.src(['./.tmp', './public'], {read: false})
      .pipe(clean());
});

gulp.task('copyhtml', function(){
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('./public/'))
});

gulp.task('jade', function() {
    // var YOUR_LOCALS = {};
   
    // gulp.src('./source/*.jade')
    gulp.src('./source/!(_)*.jade')
      .pipe(plumber())
      .pipe(data(function(){
        let stationData = require('./source/data/stations.json')
        let menu = require('./source/data/menu.json')
        let source = {
          "stationData": stationData,
          "menu": menu
        }
        return source;
      }))
      .pipe(jade({
        pretty: true
      }))
      .pipe(gulp.dest('./public/'))
      .pipe(browserSync.stream())
  });

  gulp.task('sass', function () {
    return gulp.src('./source/scss/**/*.scss')
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'nested',
        includePaths: ['./node_modules/bootstrap/scss']
      }).on('error', sass.logError))
      // 編譯完成 CSS
      .pipe(postcss([ autoprefixer() ]))
      .pipe(gulpif( options.env === 'production' , cleanCSS()))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('./public/css'))
      .pipe(browserSync.stream())
  });
  
  gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(concat('all.js'))
        .pipe(gulpif( options.env === 'production' , uglify({
          compress: {
            drop_console: true  // 自動移除console
          }
        })))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
  );

  gulp.task('vendorJs', function(){
    return gulp.src([
        './node_modules/jquery/dist/jquery.min.js',
        './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
      ])
      .pipe(concat('vendors.js'))
      .pipe(gulpif( options.env === 'production' , uglify()))
      .pipe(gulp.dest('./public/js'))
  });

  gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        },
        reloadDebounce: 2000
    });
  });

  exports.imageMin = () => (
    gulp.src('./source/images/*')
        .pipe(gulpif( options.env === 'production' , imagemin()))
        .pipe(gulp.dest('./public/images'))
  );

  gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/**/*.js', ['babel']);
  });

  gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
      .pipe(ghPages());
  });

  gulp.task('sequence', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs', 'imageMin'))

  gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs' , 'browser-sync', 'imageMin', 'watch']);
