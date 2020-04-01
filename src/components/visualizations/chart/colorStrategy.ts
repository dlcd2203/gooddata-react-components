// (C) 2020 GoodData Corporation
import { AFM, Execution } from "@gooddata/typings";
import { TypeGuards } from "@gooddata/gooddata-js";

import { IColorAssignment, IColorMapping, IColorPalette } from "../../../interfaces/Config";
import { getColorByGuid, getRgbStringFromRGB } from "../utils/color";
import { IColorStrategy, ICreateColorAssignmentReturnValue } from "./colorFactory";

abstract class ColorStrategy implements IColorStrategy {
    protected palette: string[];
    protected fullColorAssignment: IColorAssignment[];
    protected outputColorAssignment: IColorAssignment[];

    constructor(
        colorPalette: IColorPalette,
        colorMapping: IColorMapping[],
        viewByAttribute: any,
        stackByAttribute: any,
        executionResponse: Execution.IExecutionResponse,
        afm: AFM.IAfm,
        occupiedMeasureBucketsLocalIdentifiers?: string[],
    ) {
        const { fullColorAssignment, outputColorAssignment } = this.createColorAssignment(
            colorPalette,
            colorMapping,
            viewByAttribute,
            stackByAttribute,
            executionResponse,
            afm,
            occupiedMeasureBucketsLocalIdentifiers,
        );
        this.fullColorAssignment = fullColorAssignment;
        this.outputColorAssignment = outputColorAssignment ? outputColorAssignment : fullColorAssignment;

        this.palette = this.createPalette(
            colorPalette,
            this.fullColorAssignment,
            viewByAttribute,
            stackByAttribute,
        );
    }

    public getColorByIndex(index: number): string {
        return this.palette[index];
    }

    public getColorAssignment() {
        return this.outputColorAssignment;
    }

    public getFullColorAssignment() {
        return this.fullColorAssignment;
    }

    protected createPalette(
        colorPalette: IColorPalette,
        colorAssignment: IColorAssignment[],
        _viewByAttribute: any,
        _stackByAttribute: any,
    ): string[] {
        return colorAssignment.map((map, index: number) => {
            const color = TypeGuards.isGuidColorItem(map.color)
                ? getColorByGuid(colorPalette, map.color.value, index)
                : map.color.value;
            return getRgbStringFromRGB(color);
        });
    }

    protected abstract createColorAssignment(
        colorPalette: IColorPalette,
        colorMapping: IColorMapping[],
        viewByAttribute: any,
        stackByAttribute: any,
        executionResponse: Execution.IExecutionResponse,
        afm: AFM.IAfm,
        occupiedMeasureBucketsLocalIdentifiers?: string[],
    ): ICreateColorAssignmentReturnValue;
}

export default ColorStrategy;
