const express = require('express')
const path = require('path')

module.exports = function (app) {
  app.use('/dependencies', express.static(path.join(__dirname, 'dependencies')))
  app.use('/data', express.static(path.join(__dirname, 'data')))
}
