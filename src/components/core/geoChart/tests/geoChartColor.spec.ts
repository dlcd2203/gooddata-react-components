// (C) 2020 GoodData Corporation
import { IPushpinColor, IGeoConfig } from "../../../../interfaces/GeoChart";
import uniq = require("lodash/uniq");
import {
    getColorIndexInPalette,
    getColorPaletteMapping,
    getPushpinColors,
    generateLegendColorData,
} from "../geoChartColor";

import { IColorStrategy } from "../../../visualizations/chart/colorFactory";
import { DEFAULT_COLOR_PALETTE, DEFAULT_COLORS } from "../../../visualizations/utils/color";
import { IUnwrappedAttributeHeaderWithItems } from "../../../visualizations/typings/chart";
import { getGeoConfig, getExecutionResponse } from "../../../../../stories/data/geoChart";
import { convertBucketsToAFM } from "../../../../helpers/conversion";
import GeoChartColorStrategy from "../../../visualizations/chart/colorStrategies/geoChart";
import { Execution } from "@gooddata/typings";
import { EMPTY_SEGMENT_ITEM } from "../../../../constants/geoChart";

function createColorStrategy(
    executionResponse: Execution.IExecutionResponse,
    geoConfig: IGeoConfig,
    segmentItems?: string[],
): IColorStrategy {
    const afm = convertBucketsToAFM(geoConfig.mdObject.buckets);
    const locationAttribute: Execution.IAttributeHeader = {
        attributeHeader: {
            identifier: "label.state",
            uri: "/gdc/md/projectId/obj/1",
            name: "State",
            localIdentifier: "a_state",
            formOf: {
                uri: "/gdc/md/projectId/obj/1",
                identifier: "label.state",
                name: "State",
            },
        },
    };

    if (segmentItems && segmentItems.length) {
        const items = uniq(segmentItems).map((name, index) => {
            return {
                attributeHeaderItem: {
                    name: name || EMPTY_SEGMENT_ITEM,
                    uri: `/gdc/md/projectId/obj/2/elements?id=${index}`,
                },
            };
        });
        const segmentAttribute: IUnwrappedAttributeHeaderWithItems = {
            identifier: "label.type",
            uri: "/gdc/md/projectId/obj/2",
            name: "Type",
            localIdentifier: "a_type",
            formOf: {
                uri: "/gdc/md/projectId/obj/2",
                identifier: "label.type",
                name: "Type",
            },
            items,
        };
        return new GeoChartColorStrategy(
            DEFAULT_COLOR_PALETTE,
            null,
            null,
            segmentAttribute,
            executionResponse,
            afm,
        );
    }

    return new GeoChartColorStrategy(
        DEFAULT_COLOR_PALETTE,
        null,
        locationAttribute,
        null,
        executionResponse,
        afm,
    );
}

describe("getPushpinColors", () => {
    function createSegmentItems(count: number): string[] {
        return Array(count)
            .fill(0)
            .map((_item: number, index: number): string => `name_${index}`);
    }

    it("should return pushpin RGB colors", () => {
        const segmentItems = createSegmentItems(5);
        const duplicatedSegmentItems: string[] = [...segmentItems, ...segmentItems];
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
            true,
            true,
            false,
            false,
            true,
        );
        const geoConfig: IGeoConfig = getGeoConfig({
            isWithLocation: true,
            isWithColor: true,
            isWithSegment: true,
        });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, segmentItems);
        const colors: number[] = [10, 20, 30, 40, 50, 10, 20, 30, 40, 50];
        const expectedColors: IPushpinColor[] = [
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(127,224,198)", border: "rgb(0,193,141)" },
            { background: "rgb(237,136,129)", border: "rgb(229,77,66)" },
            { background: "rgb(241,134,0)", border: "rgb(241,134,0)" },
            { background: "rgb(171,85,163)", border: "rgb(171,85,163)" },
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(127,224,198)", border: "rgb(0,193,141)" },
            { background: "rgb(237,136,129)", border: "rgb(229,77,66)" },
            { background: "rgb(241,134,0)", border: "rgb(241,134,0)" },
            { background: "rgb(171,85,163)", border: "rgb(171,85,163)" },
        ];
        expect(getPushpinColors(colors, duplicatedSegmentItems, colorStrategy)).toEqual(expectedColors);
    });

    it("should return default RGB color when colors and segmentBy are empty", () => {
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(true);
        const geoConfig: IGeoConfig = getGeoConfig({ isWithLocation: true });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig);
        expect(getPushpinColors([], undefined, colorStrategy)).toEqual([
            {
                background: "rgb(20,178,226)",
                border: "rgb(233,237,241)",
            },
        ]);
    });

    it("should return one RGB color when all colors having same values and segmentBy is empty", () => {
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
            true,
            false,
            false,
            false,
            true,
        );
        const geoConfig: IGeoConfig = getGeoConfig({ isWithLocation: true, isWithColor: true });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig);
        expect(getPushpinColors([10, 10], undefined, colorStrategy)).toEqual([
            { background: "rgb(20,178,226)", border: "rgb(233,237,241)" },
        ]);
    });

    it("should return pushpin RGB colors with null values", () => {
        const segmentItems: string[] = createSegmentItems(5);
        const colors: number[] = [10, null, 30, 40, 50];
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
            true,
            true,
            false,
            false,
            true,
        );
        const geoConfig: IGeoConfig = getGeoConfig({
            isWithLocation: true,
            isWithSegment: true,
            isWithColor: true,
        });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, segmentItems);
        const expectedColors: IPushpinColor[] = [
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(212,244,236)", border: "rgb(0,193,141)" },
            { background: "rgb(237,136,129)", border: "rgb(229,77,66)" },
            { background: "rgb(241,134,0)", border: "rgb(241,134,0)" },
            { background: "rgb(171,85,163)", border: "rgb(171,85,163)" },
        ];
        expect(getPushpinColors(colors, segmentItems, colorStrategy)).toEqual(expectedColors);
    });

    it("should return pushpin RGB colors with null value without segment", () => {
        const colors: number[] = [10, null, 30, 40, 50];
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
            true,
            false,
            false,
            false,
            true,
        );
        const geoConfig: IGeoConfig = getGeoConfig({ isWithLocation: true, isWithColor: true });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig);
        const expectedColors: IPushpinColor[] = [
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(98,203,235)", border: "rgb(20,178,226)" },
            { background: "rgb(20,178,226)", border: "rgb(20,178,226)" },
            { background: "rgb(20,178,226)", border: "rgb(20,178,226)" },
        ];
        expect(getPushpinColors(colors, undefined, colorStrategy)).toEqual(expectedColors);
    });

    it("should return pushpin RGB colors with null value with some null segment items", () => {
        const colors: number[] = [10, null, 30, 40, null, null];
        const segmentItems: string[] = [...createSegmentItems(2), ...createSegmentItems(2), "", undefined];
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
            true,
            true,
            false,
            false,
            true,
        );
        const geoConfig: IGeoConfig = getGeoConfig({
            isWithLocation: true,
            isWithColor: true,
            isWithSegment: true,
        });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, segmentItems);
        const expectedColors: IPushpinColor[] = [
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(212,244,236)", border: "rgb(0,193,141)" },
            { background: "rgb(59,190,230)", border: "rgb(20,178,226)" },
            { background: "rgb(0,193,141)", border: "rgb(0,193,141)" },
            { background: "rgb(252,234,212)", border: "rgb(241,134,0)" },
            { background: "rgb(252,234,212)", border: "rgb(241,134,0)" },
        ];
        expect(getPushpinColors(colors, segmentItems, colorStrategy)).toEqual(expectedColors);
    });

    it("should return pushpin RGB colors with range of negative and positive and null values", () => {
        const colors: number[] = [null, -100, -50, 0, 50, 100, 200];
        const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
            true,
            true,
            false,
            false,
            true,
        );
        const geoConfig: IGeoConfig = getGeoConfig({
            isWithLocation: true,
            isWithColor: true,
            isWithSegment: true,
        });
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, []);
        const expectedColors: IPushpinColor[] = [
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(215,242,250)", border: "rgb(20,178,226)" },
            { background: "rgb(176,229,245)", border: "rgb(20,178,226)" },
            { background: "rgb(137,216,240)", border: "rgb(20,178,226)" },
            { background: "rgb(98,203,235)", border: "rgb(20,178,226)" },
            { background: "rgb(59,190,230)", border: "rgb(20,178,226)" },
            { background: "rgb(20,178,226)", border: "rgb(20,178,226)" },
        ];
        expect(getPushpinColors(colors, [], colorStrategy)).toEqual(expectedColors);
    });
});

describe("getColorPaletteMapping", () => {
    const executionResponse: Execution.IExecutionResponse = getExecutionResponse(
        true,
        true,
        false,
        false,
        true,
    );
    const geoConfig: IGeoConfig = getGeoConfig({
        isWithLocation: true,
        isWithColor: true,
        isWithSegment: true,
    });
    it("should return color palette mapping with one segment item", () => {
        const segmentItems: string[] = ["only_one_item"];
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, segmentItems);
        expect(getColorPaletteMapping(colorStrategy)).toEqual({
            only_one_item: [
                "rgb(215,242,250)",
                "rgb(176,229,245)",
                "rgb(137,216,240)",
                "rgb(98,203,235)",
                "rgb(59,190,230)",
                "rgb(20,178,226)",
            ],
        });
    });

    it("should return palette in first default color with no segment item", () => {
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, []);
        expect(getColorPaletteMapping(colorStrategy)).toEqual({
            default_segment_item: [
                "rgb(215,242,250)",
                "rgb(176,229,245)",
                "rgb(137,216,240)",
                "rgb(98,203,235)",
                "rgb(59,190,230)",
                "rgb(20,178,226)",
            ],
        });
    });

    it("should return color palette mappings", () => {
        const segmentItems = Array(4)
            .fill("item")
            .map((item: string, index: number) => `${item}${index}`);
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, segmentItems);
        expect(getColorPaletteMapping(colorStrategy)).toEqual({
            item0: [
                "rgb(215,242,250)",
                "rgb(176,229,245)",
                "rgb(137,216,240)",
                "rgb(98,203,235)",
                "rgb(59,190,230)",
                "rgb(20,178,226)",
            ],
            item1: [
                "rgb(212,244,236)",
                "rgb(170,234,217)",
                "rgb(127,224,198)",
                "rgb(85,213,179)",
                "rgb(42,203,160)",
                "rgb(0,193,141)",
            ],
            item2: [
                "rgb(250,225,223)",
                "rgb(246,195,192)",
                "rgb(242,166,160)",
                "rgb(237,136,129)",
                "rgb(233,106,97)",
                "rgb(229,77,66)",
            ],
            item3: [
                "rgb(252,234,212)",
                "rgb(250,214,170)",
                "rgb(248,194,127)",
                "rgb(245,174,85)",
                "rgb(243,154,42)",
                "rgb(241,134,0)",
            ],
        });
    });

    it("should rotate to zero after 20 items", () => {
        const segmentItems = Array(21)
            .fill("item")
            .map((item: string, index: number) => `${item}${index}`);
        const colorStrategy: IColorStrategy = createColorStrategy(executionResponse, geoConfig, segmentItems);
        const mapping = getColorPaletteMapping(colorStrategy);
        expect(mapping.item0).toEqual(mapping.item20);
    });
});

describe("getColorIndexInPalette", () => {
    it.each([[0, 100], [1, 120], [2, 220], [2, 300], [3, 312], [5, 700], [5, 800], [0, null], [5, 700]])(
        "should return %s",
        (expected: number, value: number) => {
            expect(getColorIndexInPalette(value, 100, 700)).toBe(expected);
        },
    );

    it("should return 0 with Min value equal Max value ", () => {
        expect(getColorIndexInPalette(30, 100, 100)).toBe(0);
    });

    it("should return with negative color values", () => {
        expect(getColorIndexInPalette(-20, -100, -10)).toBe(5);
    });
});

describe("generateLegendColorData", () => {
    it("should return empty array if have no color series is empty", () => {
        const colorData = generateLegendColorData([], DEFAULT_COLORS[0]);
        expect(colorData).toEqual([]);
    });

    it("should return empty array if all color series have same values", () => {
        const colorSeries = [1, 1, 1, 1, 1, 1, 1];
        const colorData = generateLegendColorData(colorSeries, DEFAULT_COLORS[0]);
        expect(colorData).toEqual([]);
    });

    it("should generate full color items", () => {
        const colorSeries = [0, 1, 2, 3, 4, 5, 6];
        const colorData = generateLegendColorData(colorSeries, DEFAULT_COLORS[0]);
        expect(colorData).toEqual([
            {
                color: "rgb(215,242,250)",
                range: {
                    from: 0,
                    to: 1,
                },
            },
            {
                color: "rgb(176,229,245)",
                range: {
                    from: 1,
                    to: 2,
                },
            },
            {
                color: "rgb(137,216,240)",
                range: {
                    from: 2,
                    to: 3,
                },
            },
            {
                color: "rgb(98,203,235)",
                range: {
                    from: 3,
                    to: 4,
                },
            },
            {
                color: "rgb(59,190,230)",
                range: {
                    from: 4,
                    to: 5,
                },
            },
            {
                color: "rgb(20,178,226)",
                range: {
                    from: 5,
                    to: 6,
                },
            },
        ]);
    });
});
