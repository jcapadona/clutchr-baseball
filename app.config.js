const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'Clutchr Dev' : 'Clutchr',
  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEV ? 'com.clutchr.baseball.dev' : 'com.clutchr.baseball',
  },
});
