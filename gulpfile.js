"use strict";

const { src, dest, series, parallel, watch } = require('gulp');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cssbeautify = require('gulp-cssbeautify');
const removeComments = require('gulp-strip-css-comments');
const rename = require('gulp-rename');
const rigger = require('gulp-rigger');
const sass = require('gulp-sass')(require('sass'));
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const imagemin = require('gulp-imagemin');
const del = require('del');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const webpack = require('webpack-stream');
const postcss = require('gulp-postcss');
const svgSprite = require('gulp-svg-sprite');
const gulpZip = () => import('gulp-zip');
const ftp = require('vinyl-ftp');
const fs = require('fs');
const fileinclude = require('gulp-file-include');

/* path */
const srcPath = "src/"
const distPath = "dist/"

// path
const path = {
    build: {
        html: distPath,
        css: distPath + "assets/css/",
        js: distPath + "assets/js/",
        img: distPath + "assets/img/",
        fonts: distPath + "assets/fonts/"
    },
    src: {
        html: srcPath + "*.html",
        css: srcPath + "assets/scss/*.scss",
        js: srcPath + "assets/js/*.js",
        img: srcPath + "assets/img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    watch: {
        html:   srcPath + "**/*.html",
        js:     srcPath + "assets/js/**/*.js",
        css:    srcPath + "assets/scss/**/*.css",
        img: srcPath + "assets/img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    clean: "./" + distPath
}
// Server
function server() {
    browserSync.init({
        server: {
            baseDir: path.build.html
        }
    });
}

// HTML
function html() {
    return src(path.src.html, {base: srcPath})
        .pipe(plumber())
        .pipe(rigger())
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({ stream: true }));
}

// CSS
function css() {
    return src(path.src.css, {base: srcPath + "assets/scss/"})
        .pipe(plumber({
            errorHandler: notify.onError(err => ({
                title: "CSS Error",
                message: err.message
            }))
        }))
        .pipe(postcss())
        .pipe(autoprefixer())
        .pipe(cssbeautify())
        .pipe(dest(path.build.css))
        .pipe(cssnano())
        .pipe(removeComments())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({ stream: true }));
}

// JavaScript
function js() {
    return src(path.src.css, {base: srcPath + "assets/js/"})
        .pipe(plumber({
            errorHandler: notify.onError(err => ({
                title: "JS Error",
                message: err.message
            }))
        }))
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({ stream: true }));
}

// Images
function img() {
    return src(path.src.css, {base: srcPath + "assets/img/"})
        .pipe(imagemin())
        .pipe(dest(path.build.img))
        .pipe(browserSync.reload({ stream: true }));
}

// Fonts
function fonts() {
    return src(path.src.css, {base: srcPath + "assets/fonts/"})
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.reload({ stream: true }));
}

// Clean
function clean() {
    return del(path.clean);
}

// Watch files
function watchFiles() {
    watch(path.watch.html, html);
    watch(path.watch.css, css);
    watch(path.watch.js, js);
    watch(path.watch.img, img);
    watch(path.watch.fonts, fonts);
}

// Задача для архивирования
async function createZip() {
    const { default: gulpZip } = await gulpZip();
    return gulp.src('dist/**/*')
        .pipe(gulpZip('archive.zip'))
        .pipe(gulp.dest('zip'));
}

// Build
const build = series(clean, parallel(html, css, js, img, fonts));

// Default
const dev = parallel(build, watchFiles, server);

exports.html = html;
exports.css = css;
exports.js = js;
exports.img = img;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watch = watchFiles;
exports.createZip = createZip;
exports.default = dev;
