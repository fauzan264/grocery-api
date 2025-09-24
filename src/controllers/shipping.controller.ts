import { Request, Response } from "express";
import {
  citiesShippingService,
  districtsShippingService,
  provincesByIdShippingService,
  provincesShippingService,
} from "../services/shipping.service";

export const provincesShippingController = async (
  req: Request,
  res: Response
) => {
  const provinces = await provincesShippingService();

  res.status(200).json({
    success: true,
    message: "Successfully fetched list of provinces",
    data: provinces,
  });
};

export const provincesByIdShippingController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  const province = await provincesByIdShippingService({
    id: Number(id),
  });

  res.status(200).json({
    success: true,
    message: "Successfully fetched get province",
    data: province,
  });
};

export const citiesShippingController = async (req: Request, res: Response) => {
  const { provinceId } = req.params;
  const { id, name } = req.query;

  const cities = await citiesShippingService({
    provinceId: Number(provinceId),
    id: Number(id) || undefined,
    name: String(name) || undefined,
  });

  res.status(200).json({
    success: true,
    message: "Successfully fetched list of cities",
    data: cities,
  });
};

export const districtsShippingController = async (
  req: Request,
  res: Response
) => {
  const { cityId } = req.params;
  const { id, name } = req.query;

  const districts = await districtsShippingService({
    cityId: Number(cityId),
    id: Number(id) || undefined,
    name: String(name) || undefined,
  });

  res.status(200).json({
    success: true,
    message: "Successfully fetched list of districts",
    data: districts,
  });
};
