const envFile = process.env.APP_ENV === 'production' ? '.env.production' : '.env.development';

// Log for debugging build issues (will appear in your EAS build logs)
console.log('[BABEL CONFIG] Loading environment file:', envFile, 'because APP_ENV is:', process.env.APP_ENV);
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: envFile,
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
