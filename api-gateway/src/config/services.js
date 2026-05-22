const env = require('./env');

module.exports = {
  users: {
    route: '/api/users',
    target: `${env.userServiceUrl}/api/v1/users`
  },
  movies: {
    route: '/api/movies',
    target: `${env.movieServiceUrl}/api/v1/movies`
  },
  bookings: {
    route: '/api/bookings',
    target: `${env.bookingServiceUrl}/api/v1/bookings`
  }
};
