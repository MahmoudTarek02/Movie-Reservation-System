const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/v1/users',
  maxAge: Number.parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '30', 10) * 24 * 60 * 60 * 1000
});

const setRefreshTokenCookie = (res, token) => {
  res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken', token, getRefreshTokenCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/users'
  });
};

module.exports = {
  clearRefreshTokenCookie,
  setRefreshTokenCookie
};
