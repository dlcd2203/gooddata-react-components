// (C) 2020 GoodData Corporation

import { Execution } from "@gooddata/typings";

type UnwrappedAttributeHeader = Execution.IAttributeHeader["attributeHeader"];

export interface IUnwrappedAttributeHeaderWithItems extends UnwrappedAttributeHeader {
    items: Execution.IResultAttributeHeaderItem[];
}
type UnwrappedAttributeHeaderItem = Execution.IResultAttributeHeaderItem["attributeHeaderItem"];
export interface IAttributeItem extends UnwrappedAttributeHeaderItem {
    attribute: IUnwrappedAttributeHeaderWithItems;
}

export type UnwrappedMeasureHeaderItem = Execution.IMeasureHeaderItem["measureHeaderItem"];
