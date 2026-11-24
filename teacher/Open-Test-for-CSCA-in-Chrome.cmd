@echo off
rem Opens Test for CSCA in Google Chrome, even when another browser is the default.
start "" chrome "https://291kimyatcome-coder.github.io/CSCA-TEST/"
if errorlevel 1 start "" "https://291kimyatcome-coder.github.io/CSCA-TEST/"
