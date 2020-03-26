// (C) 2020 GoodData Corporation
import { IColorItem, IGuidColorItem, IColorPalette } from "@gooddata/gooddata-js";
import { AFM, Execution } from "@gooddata/typings";

import ColorStrategy from "../colorStrategy";
import { IColorAssignment, IColorMapping } from "../../../../interfaces/Config";
import { getColorFromMapping } from "../../utils/color";
import { getMeasureGroupHeaderItemsInDimension } from "../../../../helpers/executionResultHelper";
import { ICreateColorAssignmentReturnValue } from "../colorFactory";
import { isValidMappedColor } from "./utils";
import { IGeoData } from "../../../../interfaces/GeoChart";
const emptyColorPaletteItem: IGuidColorItem = { type: "guid", value: "none" };

class MeasureGeoChartColorStrategy extends ColorStrategy {
    protected createColorAssignment(
        colorPalette: IColorPalette,
        colorMapping: IColorMapping[],
        _viewByAttribute: any,
        _stackByAttribute: any,
        executionResponse: Execution.IExecutionResponse,
        afm: AFM.IAfm,
        _occupiedMeasureBucketsLocalIdentifiers?: string[],
        geoData?: IGeoData,
    ): ICreateColorAssignmentReturnValue {
        const { size, color } = geoData;
        const measureHeaderItems = getMeasureGroupHeaderItemsInDimension(executionResponse.dimensions);
        // get Color Measure if Measure Group has two items
        const defaultMeasureItem: Execution.IMeasureHeaderItem = color
            ? measureHeaderItems[color.index]
            : size
            ? measureHeaderItems[size.index]
            : null;
        const colorMeasure: IColorItem = this.mapMeasureColor(
            defaultMeasureItem,
            colorPalette,
            colorMapping,
            executionResponse,
            afm,
        );
        const mappedMeasure: IColorAssignment = {
            headerItem: defaultMeasureItem,
            color: colorMeasure,
        };
        return {
            fullColorAssignment: [mappedMeasure],
        };
    }

    protected mapMeasureColor(
        headerItem: Execution.IMeasureHeaderItem,
        colorPalette: IColorPalette,
        colorMapping: IColorMapping[],
        executionResponse: Execution.IExecutionResponse,
        afm: AFM.IAfm,
    ): IColorItem {
        if (!headerItem) {
            return emptyColorPaletteItem;
        }

        const mappedColor = getColorFromMapping(headerItem, colorMapping, executionResponse, afm);

        return isValidMappedColor(mappedColor, colorPalette)
            ? mappedColor
            : {
                  type: "guid",
                  value: colorPalette[0].guid,
              };
    }
}

export default MeasureGeoChartColorStrategy;
