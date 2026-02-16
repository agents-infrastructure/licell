# VSwitch Management

VSwitch CRUD, CIDR reservations, and default VSwitch creation.

## createVSwitch

**Signature:** `createVSwitch(request: CreateVSwitchRequest)`

When you call this operation, take note of the following limits: *   You can create at most 150 vSwitches in a virtual private cloud (VPC). *   The first IP address and last three IP addresses of each.

**Parameters:** See `CreateVSwitchRequest` model.

## deleteVSwitch

**Signature:** `deleteVSwitch(request: DeleteVSwitchRequest)`

When you call this operation, take note of the following limits: *   Before you delete a vSwitch, you must first release or remove all virtual private cloud (VPC) resources, including vSwitches, insta.

**Parameters:** See `DeleteVSwitchRequest` model.

## describeVSwitches

**Signature:** `describeVSwitches(request: DescribeVSwitchesRequest)`

Queries the information about available vSwitches that are used for an internal network..

**Parameters:** See `DescribeVSwitchesRequest` model.

## modifyVSwitchAttribute

**Signature:** `modifyVSwitchAttribute(request: ModifyVSwitchAttributeRequest)`

**ModifyVSwitchAttribute** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVSwitchAttributes](http.

**Parameters:** See `ModifyVSwitchAttributeRequest` model.

## createDefaultVSwitch

**Signature:** `createDefaultVSwitch(request: CreateDefaultVSwitchRequest)`

When you call this operation, take note of the following limits: *   The first IP address and last three IP addresses of a vSwitch CIDR block are reserved. For example, if the CIDR block of a vSwitch .

**Parameters:** See `CreateDefaultVSwitchRequest` model.

## createVSwitchCidrReservation

**Signature:** `createVSwitchCidrReservation(request: CreateVSwitchCidrReservationRequest)`

## [](#)Description Take note of the following items: *   You can create at most 10 reserved IPv4 CIDR blocks and 10 reserved IPv6 CIDR blocks for each vSwitch in a virtual private cloud (VPC). *   Af.

**Parameters:** See `CreateVSwitchCidrReservationRequest` model.

## deleteVSwitchCidrReservation

**Signature:** `deleteVSwitchCidrReservation(request: DeleteVSwitchCidrReservationRequest)`

## [](#)Description *   Before you call this operation, make sure that the IP address allocated to an elastic network interface (ENI) from the reserved CIDR block is deleted. If the IP address of the .

**Parameters:** See `DeleteVSwitchCidrReservationRequest` model.

## describeVSwitchAttributes

**Signature:** `describeVSwitchAttributes(request: DescribeVSwitchAttributesRequest)`

Queries the detailed information about a vSwitch..

**Parameters:** See `DescribeVSwitchAttributesRequest` model.

## getVSwitchCidrReservationUsage

**Signature:** `getVSwitchCidrReservationUsage(request: GetVSwitchCidrReservationUsageRequest)`

Queries the usage of a prefix list..

**Parameters:** See `GetVSwitchCidrReservationUsageRequest` model.

## listVSwitchCidrReservations

**Signature:** `listVSwitchCidrReservations(request: ListVSwitchCidrReservationsRequest)`

Queries the CIDR reservation information about vSwitches..

**Parameters:** See `ListVSwitchCidrReservationsRequest` model.


## modifyVSwitchCidrReservationAttribute

**Signature:** `modifyVSwitchCidrReservationAttribute(request: ModifyVSwitchCidrReservationAttributeRequest)`

## [](#)Usage notes You cannot repeatedly call **ModifyVSwitchCidrReservationAttribute** within a specific time period..

