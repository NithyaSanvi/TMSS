include(NPMInstall)
npm_install(package.json PUBLIC public SOURCE src DESTINATION ${PYTHON_INSTALL_DIR}/lofar/sas/frontend/tmss_webapp/build)
