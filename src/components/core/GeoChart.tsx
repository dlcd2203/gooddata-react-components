// (C) 2019-2020 GoodData Corporation
import * as React from "react";
import { WrappedComponentProps } from "react-intl";
import * as invariant from "invariant";
import get = require("lodash/get");
import isEqual = require("lodash/isEqual");
import { ICommonChartProps } from "./base/BaseChart";
import { BaseVisualization } from "./base/BaseVisualization";
import { geoValidatorHOC } from "./base/GeoValidatorHOC";
import {
    commonDefaultProps,
    ILoadingInjectedProps,
    visualizationLoadingHOC,
} from "./base/VisualizationLoadingHOC";
import GeoChartLegendRenderer, { IGeoChartLegendRendererProps } from "./geoChart/GeoChartLegendRenderer";
import GeoChartRenderer, { IGeoChartRendererProps } from "./geoChart/GeoChartRenderer";

import { IDataSourceProviderInjectedProps } from "../afm/DataSourceProvider";
import { DEFAULT_DATA_POINTS_LIMIT, EMPTY_SEGMENT_ITEM } from "../../constants/geoChart";
import {
    IGeoConfig,
    IGeoData,
    IPushpinCategoryLegendItem,
    IValidationResult,
    IGeoLngLat,
} from "../../interfaces/GeoChart";
import { getValidColorPalette } from "../visualizations/utils/color";
import { isDataOfReasonableSize } from "../../helpers/geoChart/common";
import { getGeoData, getGeoBucketsFromMdObject } from "../../helpers/geoChart/data";
import { TOP, BOTTOM } from "../visualizations/chart/legend/PositionTypes";
import { IColorAssignment, IColorPalette } from "../../interfaces/Config";
import { isMappingHeaderAttributeItem } from "../../interfaces/MappingHeader";
import { IColorStrategy } from "../visualizations/chart/colorFactory";
import { getColorStrategy } from "../../helpers/geoChart/colorStrategy";

export function renderChart(props: IGeoChartRendererProps): React.ReactElement {
    return <GeoChartRenderer {...props} />;
}

export function renderLegend(props: IGeoChartLegendRendererProps): React.ReactElement {
    return <GeoChartLegendRenderer {...props} />;
}

export interface ICoreGeoChartProps extends ICommonChartProps, IDataSourceProviderInjectedProps {
    legendPosition?: string;
    config?: IGeoConfig;
    chartRenderer?: (props: IGeoChartRendererProps) => React.ReactElement;
    legendRenderer?: (props: IGeoChartLegendRendererProps) => React.ReactElement;
    onCenterPositionChanged?: (center: IGeoLngLat) => void;
    onZoomChanged?: (zoom: number) => void;
}

export type IGeoChartInnerProps = ICoreGeoChartProps &
    ILoadingInjectedProps &
    IDataSourceProviderInjectedProps &
    WrappedComponentProps;

export interface IGeoChartInnerState {
    enabledLegendItems: IPushpinCategoryLegendItem[];
}
export interface IGeoChartInnerOptions {
    geoData: IGeoData;
    categoryItems: IPushpinCategoryLegendItem[];
    colorPalette: IColorPalette;
    colorStrategy: IColorStrategy;
}
/**
 * Geo Chart react component
 */
export class GeoChartInner extends BaseVisualization<IGeoChartInnerProps, IGeoChartInnerState> {
    public static defaultProps: Partial<IGeoChartInnerProps> = {
        ...commonDefaultProps,
        chartRenderer: renderChart,
        legendRenderer: renderLegend,
        legendPosition: TOP,
        config: {
            mapboxToken: "",
        },
    };

    private geoChartOptions: IGeoChartInnerOptions;

    public constructor(props: IGeoChartInnerProps) {
        super(props);
        this.state = {
            enabledLegendItems: [],
        };
    }

    public componentDidUpdate(prevProps: IGeoChartInnerProps) {
        const isColorMappingChanged = this.isColorMappingChanged(prevProps);
        const isExcutionChanged = this.shouldGeoChartUpdate(prevProps);

        if (!isExcutionChanged && !isColorMappingChanged) {
            return;
        }

        const {
            config: { mdObject, colorMapping, colors, colorPalette },
            execution,
            onDataTooLarge,
            dataSource,
            // pushData, // TODO
        } = this.props;
        const buckets = getGeoBucketsFromMdObject(mdObject);

        if (isExcutionChanged) {
            const geoData = getGeoData(buckets, execution);
            const { isDataTooLarge } = this.validateData(geoData);
            if (isDataTooLarge) {
                invariant(onDataTooLarge, "GeoChart's onDataTooLarge callback is missing.");
                return onDataTooLarge();
            }
            this.setGeoChartInnerOptions(geoData);

            const {
                categoryItems,
                geoData: { segment },
            } = this.geoChartOptions;
            if (segment) {
                this.setState({
                    enabledLegendItems: [...categoryItems],
                });
            }
        } else if (isColorMappingChanged) {
            // TODO: ======
            const { geoData } = this.geoChartOptions;
            const { pushData } = this.props;
            const { segment } = geoData;
            const palette: IColorPalette = getValidColorPalette(colors, colorPalette);
            const colorStrategy: IColorStrategy = getColorStrategy(
                palette,
                colorMapping,
                geoData,
                execution,
                dataSource.getAfm(),
            );

            let categoryItems: IPushpinCategoryLegendItem[] = [];
            if (segment) {
                categoryItems = this.getCategoryLegendItems(colorStrategy);
            }

            pushData({
                colors: {
                    colorAssignments: colorStrategy.getColorAssignment(),
                    colorPalette: palette,
                },
            });

            // if (segment) {
            this.setState({
                enabledLegendItems: [...categoryItems],
            });
            // }
        }
    }

    public renderVisualization() {
        const classes: string = `gd-geo-component s-gd-geo-component flex-direction-${this.getFlexDirection()}`;
        return (
            <div className={classes}>
                {this.renderLegend()}
                {this.renderChart()}
            </div>
        );
    }

    private getFlexDirection() {
        const { legendPosition: position } = this.props;

        if (position === TOP || position === BOTTOM) {
            return "column";
        }

        return "row";
    }

    private shouldGeoChartUpdate = (prevProps: IGeoChartInnerProps): boolean => {
        if (!this.props.execution) {
            return false;
        }

        if (!prevProps.execution) {
            return true;
        }

        const {
            execution: { executionResponse: prevExecutionResponse },
        } = prevProps;
        const {
            execution: { executionResponse },
        } = this.props;

        return !isEqual(prevExecutionResponse, executionResponse);
    };

    private isColorMappingChanged = (prevProps: IGeoChartInnerProps): boolean => {
        const {
            config: { colors, colorPalette, colorMapping },
        } = this.props;

        const {
            config: { colors: prevColors, colorPalette: prevColorPalette, colorMapping: prevColorMapping },
        } = prevProps;

        return !(
            isEqual(colors, prevColors) &&
            isEqual(colorPalette, prevColorPalette) &&
            isEqual(colorMapping, prevColorMapping)
        );
    };

    private onLegendItemClick = (item: IPushpinCategoryLegendItem): void => {
        const enabledLegendItems: IPushpinCategoryLegendItem[] = this.state.enabledLegendItems.map(
            (legendItem: IPushpinCategoryLegendItem, index: number): IPushpinCategoryLegendItem => {
                if (index === item.legendIndex) {
                    return { ...item, isVisible: !item.isVisible };
                }
                return legendItem;
            },
        );
        this.setState({ enabledLegendItems });
    };

    private getCategoryLegendItems(colorStrategy: IColorStrategy): IPushpinCategoryLegendItem[] {
        const colorAssignment: IColorAssignment[] = colorStrategy.getColorAssignment();
        return colorAssignment.map(
            (item: IColorAssignment, legendIndex: number): IPushpinCategoryLegendItem => {
                const name: string = isMappingHeaderAttributeItem(item.headerItem)
                    ? item.headerItem.attributeHeaderItem.name
                    : EMPTY_SEGMENT_ITEM;
                const color: string = colorStrategy.getColorByIndex(legendIndex);
                return {
                    name,
                    legendIndex,
                    color,
                    isVisible: true,
                };
            },
        );
    }

    private setGeoChartInnerOptions(geoData: IGeoData) {
        const { segment } = geoData;
        const {
            config: { colors, colorPalette, colorMapping },
            dataSource,
            execution,
            pushData,
        } = this.props;

        const palette: IColorPalette = getValidColorPalette(colors, colorPalette);
        const colorStrategy: IColorStrategy = getColorStrategy(
            palette,
            colorMapping,
            geoData,
            execution,
            dataSource.getAfm(),
        );

        let categoryItems: IPushpinCategoryLegendItem[] = [];
        if (segment) {
            categoryItems = this.getCategoryLegendItems(colorStrategy);
        }

        pushData({
            colors: {
                colorAssignments: [...colorStrategy.getColorAssignment()],
                colorPalette: [...palette],
            },
        });

        this.geoChartOptions = {
            geoData,
            categoryItems,
            colorStrategy,
            colorPalette: palette,
        };
    }

    private getLegendProps(): IGeoChartLegendRendererProps {
        const { geoChartOptions } = this;
        const { config, legendPosition: position } = this.props;

        if (!geoChartOptions) {
            return {
                config,
                position,
                geoData: {},
                colorLegendValue: "",
            };
        }

        const { geoData, colorStrategy } = geoChartOptions;
        const { segment } = geoData;
        const { enabledLegendItems } = this.state;
        const colorLegendValue: string = colorStrategy.getColorByIndex(0);
        if (segment && enabledLegendItems.length) {
            return {
                config,
                position,
                geoData,
                colorLegendValue,
                categoryItems: enabledLegendItems,
                onItemClick: this.onLegendItemClick,
            };
        }

        return { config, position, geoData, colorLegendValue };
    }

    private getChartProps(): IGeoChartRendererProps {
        const { geoChartOptions } = this;
        const { config, execution, afterRender, onCenterPositionChanged, onZoomChanged } = this.props;

        if (!geoChartOptions) {
            return {
                config,
                execution,
                afterRender,
                geoData: {},
                onCenterPositionChanged,
                onZoomChanged,
                colorStrategy: null,
            };
        }

        const { geoData, colorStrategy } = geoChartOptions;
        const segmentIndex: number = get(geoChartOptions, "geoData.segment.index");

        const chartProps: IGeoChartRendererProps = {
            config,
            execution,
            afterRender,
            geoData,
            onCenterPositionChanged,
            onZoomChanged,
            colorStrategy,
        };

        if (segmentIndex) {
            const selectedSegmentItems: string[] = this.state.enabledLegendItems.reduce(
                (result: string[], item: IPushpinCategoryLegendItem): string[] => {
                    if (item.isVisible) {
                        return [...result, item.name];
                    }
                    return result;
                },
                [],
            );
            return {
                ...chartProps,
                config: { ...config, selectedSegmentItems },
            };
        }

        return chartProps;
    }

    private renderChart = (): React.ReactElement => {
        const { chartRenderer } = this.props;
        const chartProps: IGeoChartRendererProps = this.getChartProps();
        return chartRenderer(chartProps);
    };

    private renderLegend = (): React.ReactElement => {
        const { legendRenderer } = this.props;
        const legendProps: IGeoChartLegendRendererProps = this.getLegendProps();
        return legendRenderer(legendProps);
    };

    private validateData = (geoData: IGeoData): IValidationResult => {
        if (!this.props.execution) {
            return;
        }
        const {
            config: { limit = DEFAULT_DATA_POINTS_LIMIT },
            execution: { executionResult },
        } = this.props;

        return {
            isDataTooLarge: !isDataOfReasonableSize(executionResult, geoData, limit),
        };
    };
}

export const GeoChart = geoValidatorHOC(visualizationLoadingHOC(GeoChartInner, true));
