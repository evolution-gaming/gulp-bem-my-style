gulp = require "gulp"
gutil = require "gulp-util"
cache = require "gulp-cached"
changed = require "gulp-changed"
rename = require "gulp-rename"
stylus = require "gulp-stylus"

babel = require "gulp-babel"
plumber = require "gulp-plumber"
watch = require "gulp-watch"
notify = require "gulp-notify"
runSequence = require "run-sequence"


src =
  build: "./src/*.js"
  stylus: "./examples/**/*.styl"

dest =
  build: "./dist"
  stylus: "./examples/"

gulp.task "build", ["babel", "stylus", "examples"]
gulp.task "default", ["build", "watch"]

gulp.task "stylus", ->
  gulp.src src.stylus
  .pipe plumber(
    errorHandler: notify.onError(
      "Stylus build error: <%= error.name %> <%= error.message %>"
    )
  )
  .pipe cache "stylus"
  .pipe stylus()
  .pipe rename (path) ->
    path.extname = ".css"
  .pipe gulp.dest dest.stylus

gulp.task "examples", ->
  bem = require "./dist/index.js"
  bem
    src: "./examples/**/*.css"
    dest: "./examples/CSS.js"
    opts:
      ignoreEmptyBlocks: true

doBabel = (src, dest) ->
  gulp.src src
  .pipe plumber(
    errorHandler: notify.onError(
      "Babel build error: <%= error.name %> <%= error.message %>"
    )
  )
  .pipe cache "babel"
  .pipe babel()
  .on "error", (error) ->
    @hadError = true
    gutil.log(
      gutil.colors.red(
        "#{error.name}: #{error.message} (#{error.fileName})"
      )
    )
  .pipe gulp.dest dest

gulp.task "babel", ->
  doBabel src.build, dest.build

gulp.task "watch", ["build"], ->
  watch [src.build], ->
    runSequence "babel"
  watch [src.stylus], ->
    runSequence "stylus"
  gutil.log "Watcher started"

