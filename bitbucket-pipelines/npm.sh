# Generates a .npmrc file configured for installing private modules:
#
# NPM_REGISTRY_URL: the full URL of your private registry
#                   defaults to registry.npmjs.org.
# NPM_TOKEN: secret token for installing private modules. This
#            this token can be found in your .npmrc, after logging in.
printf "//`node -p \"require('url').parse(process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org').host\"`/:_authToken=${NPM_TOKEN}\nregistry=${NPM_REGISTRY_URL:-https://registry.npmjs.org}\n" >> ~/.npmrc
# Installs public and private moduless.
npm install
# Publish the package.
npm publish
