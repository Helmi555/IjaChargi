class ApiHandler {

    static testApiPostRequest="/api/v1/test";
    static login="/api/v1/account/login";
    static signUp="/api/v1/account/signUp";
    static getProfileByAccountId="/api/v1/account/getUserById/:accountId";
    static registerCar="/api/v1/car/createCar";
    static getCarById="/api/v1/car/getCarById/:carId";
    static getCarsForUserById="/api/v1/car/getCarsOfUserById/:userId";
    static deleteCarForUser="/api/v1/car/deleteCarForUser/:carId/:userId";
    static getAllCarBrands="/api/v1/carBrand/getAllCarBrands";
    static getAllCarModels="/api/v1/carModel/getAllCarModels";
    static getAllNotificationByReceiverId="/api/v1/notification/getAllNotificationByReceiverId/:receiverId";
    static getAllServices="/api/v1/service/getAllServices";
    static getAllProviders="/api/v1/provider/getAllProviders";
    static getProviderById="/api/v1/provider/getProviderById/:providerId";
    static getAllStations="/api/v1/station/getAllStation";
    static getAllStationBrand="/api/v1/stationBrand/getAllStationBrand";
    static getAllChargerForStation="/api/v1/charger/getAllChargerForStation/:stationId";
    static getAllChargerPortForCharger="/api/v1/chargerPort/getAllChargerPortForCharger/:chargerId";
    static createAppointment="/api/v1/appointment/createAppointment";
    static deleteAppointmentById="/api/v1/appointment/deleteAppointmentById/:appointmentId";
    static getAllAppointmentForDateAndChargerPort="/api/v1/appointment/getAllAppointmentForDateAndChargerPort";
    static getAllAppointmentForUser="/api/v1/appointment/getALLAppointmentForUser/:userId";
    static getAllAppointmentForCar="/api/v1/appointment/getALLAppointmentForCar/:carId";

    static createCharger="/api/v1/charger/createCharger";
    static deleteCharger="/api/v1/charger/deleteCharger/:chargerId";
    static userValidation="/api/v1/account/valid/:expirationTime/:uid";

    static createChargerPort="/api/v1/chargerPort/createChargerPort/";
    static deleteChargerPort="/api/v1/chargerPort/deleteChargerPort/:chargerPortId"


  }
  module.exports=ApiHandler;