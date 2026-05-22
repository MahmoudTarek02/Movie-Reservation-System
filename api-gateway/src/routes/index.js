const services = require('../config/services');
const createServiceProxy = require('../proxies/createServiceProxy');

module.exports = (app) => {
  Object.entries(services).forEach(([serviceName, serviceConfig]) => {
    app.use(
      serviceConfig.route,
      createServiceProxy({
        serviceName,
        target: serviceConfig.target
      })
    );
  });
};
