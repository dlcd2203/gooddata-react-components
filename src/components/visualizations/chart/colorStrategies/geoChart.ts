// (C) 2020 GoodData Corporation
import { IColorPalette, IColorItem } from "@gooddata/gooddata-js";
import { AFM, Execution } from "@gooddata/typings";

import ColorStrategy from "../colorStrategy";
import { IColorMapping, IColorAssignment } from "../../../../interfaces/Config";
import AttributeColorStrategy from "./attribute";
import { getColorFromMapping } from "../../utils/color";
import { ICreateColorAssignmentReturnValue, IColorStrategy } from "../colorFactory";
import { isValidMappedColor } from "./utils";

class GeoChartColorStrategy extends ColorStrategy {
    protected createColorAssignment(
        colorPalette: IColorPalette,
        colorMapping: IColorMapping[],
        viewByAttribute: any,
        stackByAttribute: any,
        executionResponse: Execution.IExecutionResponse,
        afm: AFM.IAfm,
    ): ICreateColorAssignmentReturnValue {
        // color follows SegmentBy
        if (stackByAttribute) {
            const colorStrategy: IColorStrategy = new AttributeColorStrategy(
                colorPalette,
                colorMapping,
                null,
                stackByAttribute,
                executionResponse,
                afm,
            );
            return {
                fullColorAssignment: colorStrategy.getColorAssignment(),
            };
        }

        // color follows Location
        const mappedColor = getColorFromMapping(viewByAttribute, colorMapping, executionResponse, afm);
        const color: IColorItem = isValidMappedColor(mappedColor, colorPalette)
            ? mappedColor
            : {
                  type: "guid",
                  value: colorPalette[0].guid,
              };
        const colorAssiginment: IColorAssignment = {
            headerItem: viewByAttribute,
            color,
        };
        return {
            fullColorAssignment: [colorAssiginment],
        };
    }
}

export default GeoChartColorStrategy;
