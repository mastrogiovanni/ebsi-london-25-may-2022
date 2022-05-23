<script lang="ts">
	import { Context } from '$lib/happyPath';
	import WaitingText from '$lib/../components/WaitingText.svelte';
	import { v4 as uuidv4 } from 'uuid';
	import * as moment from 'moment';
	import {
		DppClient,
		type RegisterDeviceDto,
		type IdentityDto,
		type ChangeOwnershipDto,
		toDppIdentity
	} from '@iota/is-ict-dpp';
	import { ApiVersion, IdentityClient, ChannelClient, type ClientConfig } from '@iota/is-client';

	const defaultConfig: ClientConfig = {
		apiKey: import.meta.env.VITE_API_KEY as string,
		isGatewayUrl: import.meta.env.VITE_API_URL as string,
		apiVersion: ApiVersion.v01
	};

	const manager = {
		did: import.meta.env.VITE_IDENTITY_DID as string,
		secretKey: import.meta.env.VITE_IDENTITY_SECRET as string
	} as IdentityDto;

	const deviceInfo = {
		chId: 'device-' + uuidv4(),
		model: 'qwerty'
	};

	let dppClient = new DppClient(defaultConfig);

	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function append(context: Context, description: string, text: string) {
		description = description + '<br/>' + text;
		context.set('content', description);
		return description;
	}

	let owner: IdentityDto, repairer: IdentityDto, newOwner: IdentityDto, repairerVC: any;

	async function createIdentities(context: Context) {
		let description = '';
		let badges = [];
		context.set('title', 'Creation identity for all actors');
		owner = toDppIdentity(await new IdentityClient(defaultConfig).create('owner' + uuidv4()));
		description = append(context, description, 'Created owner');
		badges.push({
			name: 'owner',
			url: 'https://explorer.iota.org/mainnet/identity-resolver/' + owner.did
		});
		context.set('badges', badges);
		repairer = toDppIdentity(await new IdentityClient(defaultConfig).create('repairer' + uuidv4()));
		badges.push({
			name: 'repairer',
			url: 'https://explorer.iota.org/mainnet/identity-resolver/' + repairer.did
		});
		context.set('badges', badges);
		description = append(context, description, 'Created repairer');
		newOwner = toDppIdentity(await new IdentityClient(defaultConfig).create('neOwner' + uuidv4()));
		badges.push({
			name: 'new owner',
			url: 'https://explorer.iota.org/mainnet/identity-resolver/' + newOwner.did
		});
		context.set('badges', badges);
		description = append(context, description, 'Created newOwner');
		repairerVC = await dppClient
			.identities()
			.createCredential(manager, owner.did, dppClient.getOwnershipCredentialType() as any, {
				role: 'repairer'
			});
		description = append(context, description, 'Created Repairer VC');
	}

	let indexChannelAddress: string;

	async function createIndexChannel(context: Context) {
		let description =
			'The Index is a particular Stream that is responsible to save associations between CHID and Stream Id. It is used to retrieve the Stream Id associated to a Device via lookup';
		context.set('title', 'Create Index');
		context.set('content', description);
		description = append(context, description, 'Creating');
		let channelClient = new ChannelClient(defaultConfig);
		await channelClient.authenticate(manager.did, manager.secretKey);
		let indexChannel = await channelClient.create({
			name: uuidv4(),
			topics: [{ type: 'index-channel', source: 'dpp' }]
		});
		indexChannelAddress = indexChannel.channelAddress;
		description = append(context, description, 'Created Index Stream:');
		description = append(context, description, indexChannelAddress);
	}

	let channelAddress: string;

	async function registerDevice(context: Context) {
		let description = 'Device registration includes the following steps:<ul>';
		description += '<li>Creating a stream</li>';
		description += '<li>Associate CHID to Stream Id in Index</li>';
		description += '<li>Authorization in writing to channel Owner</li>';
		description += '<li>Issue of VC to Owner</li>';
		description += '</ul>';
		context.set('title', 'Register a new Device');
		context.set('content', description);
		let timestamp = parseInt((new Date().getTime() / 1000).toFixed(0));
		let registerDeviceParams: RegisterDeviceDto = {
			managerIdentity: manager,
			ownerIdentity: owner,
			credentialType: dppClient.getOwnershipCredentialType(),
			indexChannelAddress,
			type: 'proof_of_register',
			chId: deviceInfo.chId,
			payload: { chid: deviceInfo.chId, timestamp: timestamp }
		};
		description = append(context, description, 'Creating');
		let response = await dppClient.devices().registerDevice(registerDeviceParams);
		description = append(context, description, 'Device Successfully Registered');
		channelAddress = response.channelAddress;
	}

	async function updateDpp(context: Context) {
		context.set('title', 'Update DPP');
		let description = 'Update DPP means:<ul>';
		description += '<li>Verify credential of an actor (e.g. repairer)</li>';
		description += '<li>Authorize the actor in writing</li>';
		description += '<li>Let the actor write DPP update</li>';
		description += '<li>Revoke authorization to the actor</li>';
		description += '</ul>';
		let requestAccessParams = {
			managerIdentity: manager,
			subjectIdentity: repairer,
			channelAddress,
			credential: repairerVC,
			type: 'one_shot_write',
			payload: {}
		};
		// Write one shot as repairer
		description = append(context, description, 'Updating');
		await dppClient.events().oneShotWrite(requestAccessParams);
		description = append(context, description, 'DPP Updated successfully!');
	}

	async function finalStep(context: Context) {
		context.set('title', 'End');
		let description = 'The following demo shown:<ul>';
		description += "<li>Creation of decentralized identities</li>"
		description += "<li>Creation of Verifiable Credentials</li>"
		description += "<li>Register a Device</li>"
		description += "<li>Update Device DPP</li>"
		description += "<li>Change Ownership of a device</li>"
		description += "</ul>"
	}

	let events: Map<string, any>[] = [];

	let working = false;

	let context: Context;

	async function start() {

		events = [];
		working = false;
		let current: Map<string, any> = new Map<string, any>();
		if (context) {
			context.stop();
		}
		context = new Context(
			() => {
				working = true;
				current = new Map<string, any>();
				current.set('time', moment().format('h:mm:ss a'));
				current.set('date', moment().format('MMMM Do YYYY'));
				current.set('content', '');
				current.set('badges', []);
				events.push(current);
				events = events;
			},
			() => {
				working = false;
				events = events;
			},
			(key: string, value: string) => {
				current.set(key, value);
				events[events.length - 1] = current;
				events = events;
			}
		);
		context.add(createIdentities);
		context.add(createIndexChannel);
		context.add(registerDevice);
		context.add(updateDpp);
		context.add(finalStep);
		await context.execute();
	}
</script>

<svelte:head>
	<link href="/css/global.css" rel="stylesheet" />
	<link
		href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<section class="py-5 text-center container">
    <div class="row py-lg-5">
      <div class="col-lg-6 col-md-8 mx-auto">
        <h1 class="fw-light">Album example</h1>
        <p class="lead text-muted">Something short and leading about the collection below—its contents, the creator, etc. Make it short and sweet, but not too short so folks don’t simply skip over it entirely.</p>
        <p>
          <a href="#!" on:click={start} class="btn btn-primary my-2">Start</a>
		  <!--
          <a href="#" class="btn btn-secondary my-2">Secondary action</a>
		  -->
        </p>
      </div>
    </div>
  </section>

<div class="container bootdey">
	<!--
	<div class="row gutters">
		<button class="btn btn-sm" on:click={start}>Start</button>
	</div>
	-->
	{#if events.length > 0}
		<div class="row gutters">
			<div class="col-xl-12 col-lg-12 col-md-12 col-sm-12">
				<div class="card">
					<div class="card-body">
						<!-- Timeline start -->
						<div class="timeline">
							{#each events as event}
								<div class="timeline-row">
									<div class="timeline-time">
										{event.get('time')}<small>{event.get('date')}</small>
									</div>
									<div class="timeline-dot fb-bg" />
									<div class="timeline-content">
										<i class="fa fa-map-marker" />
										<h4>{event.get('title')}</h4>
										{@html event.get('content')}
										<div>
											<div class="btn-group">
												{#each event.get('badges') as badge}
													{#if badge.text}
														-
													{:else}
														<a href={badge.url} target="_blank" class="btn btn-sm btn-outline-secondary">{badge.name}</a>
													{/if}
												{/each}
											</div>
										</div>
										{#if working}
											<WaitingText />
										{/if}
									</div>
								</div>
							{/each}

							<!--
						<div class="timeline-row">
							<div class="timeline-time">
								8:00 AM<small>May 18</small>
							</div>
							<div class="timeline-dot green-one-bg" />
							<div class="timeline-content green-one">
								<i class="fa fa-warning" />
								<h4>Admin theme!</h4>
								<p>
									Milestone Admin Dashboard contains C3 graphs, flot graphs, data tables, calendar.
								</p>
								<div class="">
									<span class="badge badge-light">Design</span>
									<span class="badge badge-light">Admin</span>
								</div>
							</div>
						</div>
						<div class="timeline-row">
							<div class="timeline-time">
								7:25 PM<small>May 6</small>
							</div>
							<div class="timeline-dot green-two-bg" />
							<div class="timeline-content green-two">
								<i class="fa fa-list" />
								<h4>Best Admin Template!</h4>
								<p>
									Custom C3 graphs, Custom flot graphs, flot graphs, small graphs, Sass, profile and
									timeline.
								</p>
								<div>
									<span class="badge badge-light">Invoice</span>
									<span class="badge badge-light">Graphs</span>
								</div>
							</div>
						</div>
						<div class="timeline-row">
							<div class="timeline-time">
								3:55 PM<small>Apr 26</small>
							</div>
							<div class="timeline-dot green-three-bg" />
							<div class="timeline-content green-three">
								<i class="icon-directions" />
								<h4>Milestone Admin</h4>
								<p>
									Admin theme includes graphs, invoice, timeline, widgets, projects, calendar,
									components, layouts, todo's.
								</p>
								<div>
									<span class="badge badge-light">Profile</span>
									<span class="badge badge-light">Dashboard</span>
								</div>
							</div>
						</div>
						<div class="timeline-row">
							<div class="timeline-time">
								5:24 PM<small>Apr 12</small>
							</div>
							<div class="timeline-dot green-four-bg" />
							<div class="timeline-content green-four">
								<i class="fa fa-user" />
								<h4>Milestone Dashboard</h4>
								<p class="no-margin">
									Milestone Admin Dashboard includes invoice, profile, tasks, gallery, projects,
									maintanence.
								</p>
								<div>
									<span class="badge badge-light">Analytics</span>
									<span class="badge badge-light">Graphs</span>
								</div>
							</div>
						</div>
						<div class="timeline-row">
							<div class="timeline-time">
								11:25 AM<small>Apr 19</small>
							</div>
							<div class="timeline-dot teal-bg" />
							<div class="timeline-content teal">
								<i class="fa fa-coffee" />
								<h4>Milestone Template</h4>
								<p class="no-margin">
									Panels, alerts, notifications, new input styles, pricing plans, project plan,
									signup, login and register.
								</p>
								<div>
									<span class="badge badge-light">Labels</span>
									<span class="badge badge-light">Filters</span>
								</div>
							</div>
						</div>
						<div class="timeline-row">
							<div class="timeline-time">
								12:30 PM<small>May 25</small>
							</div>
							<div class="timeline-dot sea-green-bg" />
							<div class="timeline-content sea-green">
								<i class="fa fa-image" />
								<h4>Milestone dashboard</h4>
								<p>
									Milestone Admin Dashboard contains Ion slider, heatmap, alerts, breadcrumbs,
									alerts, pricing, signup, login and register.
								</p>
								<div>
									<span class="badge badge-light">BS 4</span>
									<span class="badge badge-light">Sass</span>
								</div>
							</div>
						</div>
					-->
						</div>
						<!-- Timeline end -->
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
