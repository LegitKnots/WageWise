module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.ios.js', '.android.js', '.ts', '.tsx', '.json'],
        root: ['.'],
        alias: {
          assets: './src/assets/',
          components: './src/components/',
          config: './src/config/',
          context: './src/context/',
          hooks: './src/hooks/',
          interfaces: './src/interfaces/',
          navigation: './src/navigation/',
          screens: './src/screens/',
          scripts: './src/scripts/',
          services: './src/services/',
          styles: './src/styles/',
          types: './src/types/',
        },
      },
    ],
  ],
};