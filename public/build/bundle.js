
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function (svelthree_mjs) {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/IntervalTimer.svelte generated by Svelte v3.38.2 */

    const file$2 = "src/IntervalTimer.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let dev0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let dev1;
    	let t10;
    	let dev2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			dev0 = element("dev");
    			t0 = text(/*elapsedHours*/ ctx[3]);
    			t1 = text(" h ");
    			t2 = text(/*elapsedMinutes*/ ctx[2]);
    			t3 = text(" min ");
    			t4 = text(/*elapsedSecounds*/ ctx[1]);
    			t5 = text(" sec ");
    			t6 = text(/*elapsedMilisecounds*/ ctx[0]);
    			t7 = text("msec");
    			t8 = space();
    			dev1 = element("dev");
    			dev1.textContent = "Start";
    			t10 = space();
    			dev2 = element("dev");
    			dev2.textContent = "Stop";
    			add_location(dev0, file$2, 37, 2, 903);
    			add_location(dev1, file$2, 40, 2, 1010);
    			add_location(dev2, file$2, 41, 2, 1047);
    			add_location(main, file$2, 36, 0, 894);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, dev0);
    			append_dev(dev0, t0);
    			append_dev(dev0, t1);
    			append_dev(dev0, t2);
    			append_dev(dev0, t3);
    			append_dev(dev0, t4);
    			append_dev(dev0, t5);
    			append_dev(dev0, t6);
    			append_dev(dev0, t7);
    			append_dev(main, t8);
    			append_dev(main, dev1);
    			append_dev(main, t10);
    			append_dev(main, dev2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(dev1, "click", /*start*/ ctx[4], false, false, false),
    					listen_dev(dev2, "click", /*stop*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*elapsedHours*/ 8) set_data_dev(t0, /*elapsedHours*/ ctx[3]);
    			if (dirty & /*elapsedMinutes*/ 4) set_data_dev(t2, /*elapsedMinutes*/ ctx[2]);
    			if (dirty & /*elapsedSecounds*/ 2) set_data_dev(t4, /*elapsedSecounds*/ ctx[1]);
    			if (dirty & /*elapsedMilisecounds*/ 1) set_data_dev(t6, /*elapsedMilisecounds*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IntervalTimer", slots, []);
    	let currentTime = 0;
    	let startTime = 0;
    	let elapsedMilisecounds = 0;
    	let elapsedSecounds = 0;
    	let elapsedMinutes = 0;
    	let elapsedHours = 0;
    	let stopCounting = false;

    	function start() {
    		stopCounting = false;
    		startTime = new Date().getTime();
    		count();
    	}

    	function stop() {
    		stopCounting = true;
    	}

    	function count() {
    		currentTime = new Date().getTime();
    		let elapsedTime = currentTime - startTime;
    		$$invalidate(3, elapsedHours = Math.floor(elapsedTime / (60 * 60 * 1000)));
    		elapsedTime -= elapsedHours * (60 * 60 * 1000);
    		$$invalidate(2, elapsedMinutes = Math.floor(elapsedTime / (60 * 1000)));
    		elapsedTime -= elapsedMinutes * (60 * 1000);
    		$$invalidate(1, elapsedSecounds = Math.floor(elapsedTime / 1000));
    		elapsedTime -= elapsedSecounds * 1000;
    		$$invalidate(0, elapsedMilisecounds = elapsedTime);

    		if (!stopCounting) {
    			requestAnimationFrame(count);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IntervalTimer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		currentTime,
    		startTime,
    		elapsedMilisecounds,
    		elapsedSecounds,
    		elapsedMinutes,
    		elapsedHours,
    		stopCounting,
    		start,
    		stop,
    		count
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentTime" in $$props) currentTime = $$props.currentTime;
    		if ("startTime" in $$props) startTime = $$props.startTime;
    		if ("elapsedMilisecounds" in $$props) $$invalidate(0, elapsedMilisecounds = $$props.elapsedMilisecounds);
    		if ("elapsedSecounds" in $$props) $$invalidate(1, elapsedSecounds = $$props.elapsedSecounds);
    		if ("elapsedMinutes" in $$props) $$invalidate(2, elapsedMinutes = $$props.elapsedMinutes);
    		if ("elapsedHours" in $$props) $$invalidate(3, elapsedHours = $$props.elapsedHours);
    		if ("stopCounting" in $$props) stopCounting = $$props.stopCounting;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		elapsedMilisecounds,
    		elapsedSecounds,
    		elapsedMinutes,
    		elapsedHours,
    		start,
    		stop
    	];
    }

    class IntervalTimer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IntervalTimer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/RandomJenga.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/RandomJenga.svelte";

    // (31:4) <Scene {sti} let:scene id="scene1" props={{ background: 0xedf2f7 }}>
    function create_default_slot_1(ctx) {
    	let perspectivecamera;
    	let t0;
    	let ambientlight;
    	let t1;
    	let directionallight;
    	let t2;
    	let mesh0;
    	let t3;
    	let mesh1;
    	let t4;
    	let orbitcontrols;
    	let current;

    	perspectivecamera = new svelthree_mjs.PerspectiveCamera({
    			props: {
    				scene: /*scene*/ ctx[5],
    				id: "cam1",
    				pos: [0, 0, 3],
    				lookAt: [0, 0, 0]
    			},
    			$$inline: true
    		});

    	ambientlight = new svelthree_mjs.AmbientLight({
    			props: { scene: /*scene*/ ctx[5], intensity: 1.25 },
    			$$inline: true
    		});

    	directionallight = new svelthree_mjs.DirectionalLight({
    			props: {
    				scene: /*scene*/ ctx[5],
    				pos: [1, 2, 1],
    				intensity: 0.8,
    				shadowMapSize: 512 * 8,
    				castShadow: true
    			},
    			$$inline: true
    		});

    	mesh0 = new svelthree_mjs.Mesh({
    			props: {
    				scene: /*scene*/ ctx[5],
    				geometry: /*cubeGeometry*/ ctx[0],
    				material: /*cubeMaterial*/ ctx[1],
    				mat: {
    					roughness: 0.5,
    					metalness: 0.5,
    					color: 16727552
    				},
    				pos: [0, 0, 0],
    				rot: [0, 0, 0],
    				castShadow: true,
    				receiveShadow: true
    			},
    			$$inline: true
    		});

    	mesh1 = new svelthree_mjs.Mesh({
    			props: {
    				scene: /*scene*/ ctx[5],
    				geometry: /*floorGeometry*/ ctx[2],
    				material: /*floorMaterial*/ ctx[3],
    				mat: {
    					roughness: 0.5,
    					metalness: 0.5,
    					side: svelthree_mjs.DoubleSide,
    					color: 16251644
    				},
    				pos: [0, -0.501, 0],
    				rot: [svelthree_mjs.MathUtils.degToRad(-90), 0, 0],
    				scale: [1, 1, 1],
    				receiveShadow: true
    			},
    			$$inline: true
    		});

    	orbitcontrols = new svelthree_mjs.OrbitControls({
    			props: {
    				scene: /*scene*/ ctx[5],
    				autoRotate: true,
    				enableDamping: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(perspectivecamera.$$.fragment);
    			t0 = space();
    			create_component(ambientlight.$$.fragment);
    			t1 = space();
    			create_component(directionallight.$$.fragment);
    			t2 = space();
    			create_component(mesh0.$$.fragment);
    			t3 = space();
    			create_component(mesh1.$$.fragment);
    			t4 = space();
    			create_component(orbitcontrols.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(perspectivecamera, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(ambientlight, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(directionallight, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(mesh0, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(mesh1, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(orbitcontrols, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const perspectivecamera_changes = {};
    			if (dirty & /*scene*/ 32) perspectivecamera_changes.scene = /*scene*/ ctx[5];
    			perspectivecamera.$set(perspectivecamera_changes);
    			const ambientlight_changes = {};
    			if (dirty & /*scene*/ 32) ambientlight_changes.scene = /*scene*/ ctx[5];
    			ambientlight.$set(ambientlight_changes);
    			const directionallight_changes = {};
    			if (dirty & /*scene*/ 32) directionallight_changes.scene = /*scene*/ ctx[5];
    			directionallight.$set(directionallight_changes);
    			const mesh0_changes = {};
    			if (dirty & /*scene*/ 32) mesh0_changes.scene = /*scene*/ ctx[5];
    			mesh0.$set(mesh0_changes);
    			const mesh1_changes = {};
    			if (dirty & /*scene*/ 32) mesh1_changes.scene = /*scene*/ ctx[5];
    			mesh1.$set(mesh1_changes);
    			const orbitcontrols_changes = {};
    			if (dirty & /*scene*/ 32) orbitcontrols_changes.scene = /*scene*/ ctx[5];
    			orbitcontrols.$set(orbitcontrols_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(perspectivecamera.$$.fragment, local);
    			transition_in(ambientlight.$$.fragment, local);
    			transition_in(directionallight.$$.fragment, local);
    			transition_in(mesh0.$$.fragment, local);
    			transition_in(mesh1.$$.fragment, local);
    			transition_in(orbitcontrols.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(perspectivecamera.$$.fragment, local);
    			transition_out(ambientlight.$$.fragment, local);
    			transition_out(directionallight.$$.fragment, local);
    			transition_out(mesh0.$$.fragment, local);
    			transition_out(mesh1.$$.fragment, local);
    			transition_out(orbitcontrols.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(perspectivecamera, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(ambientlight, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(directionallight, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(mesh0, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(mesh1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(orbitcontrols, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(31:4) <Scene {sti} let:scene id=\\\"scene1\\\" props={{ background: 0xedf2f7 }}>",
    		ctx
    	});

    	return block;
    }

    // (30:2) <Canvas let:sti w={500} h={500}>
    function create_default_slot(ctx) {
    	let scene;
    	let t;
    	let webglrenderer;
    	let current;

    	scene = new svelthree_mjs.Scene({
    			props: {
    				sti: /*sti*/ ctx[4],
    				id: "scene1",
    				props: { background: 15594231 },
    				$$slots: {
    					default: [
    						create_default_slot_1,
    						({ scene }) => ({ 5: scene }),
    						({ scene }) => scene ? 32 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	webglrenderer = new svelthree_mjs.WebGLRenderer({
    			props: {
    				sti: /*sti*/ ctx[4],
    				sceneId: "scene1",
    				camId: "cam1",
    				config: { antialias: true, alpha: true },
    				enableShadowMap: true,
    				shadowMapType: svelthree_mjs.PCFSoftShadowMap
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(scene.$$.fragment);
    			t = space();
    			create_component(webglrenderer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scene, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(webglrenderer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scene_changes = {};
    			if (dirty & /*sti*/ 16) scene_changes.sti = /*sti*/ ctx[4];

    			if (dirty & /*$$scope, scene*/ 96) {
    				scene_changes.$$scope = { dirty, ctx };
    			}

    			scene.$set(scene_changes);
    			const webglrenderer_changes = {};
    			if (dirty & /*sti*/ 16) webglrenderer_changes.sti = /*sti*/ ctx[4];
    			webglrenderer.$set(webglrenderer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scene.$$.fragment, local);
    			transition_in(webglrenderer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scene.$$.fragment, local);
    			transition_out(webglrenderer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scene, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(webglrenderer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(30:2) <Canvas let:sti w={500} h={500}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let canvas;
    	let current;

    	canvas = new svelthree_mjs.Canvas({
    			props: {
    				w: 500,
    				h: 500,
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ sti }) => ({ 4: sti }),
    						({ sti }) => sti ? 16 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(canvas.$$.fragment);
    			add_location(main, file$1, 28, 0, 630);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(canvas, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_changes = {};

    			if (dirty & /*$$scope, sti*/ 80) {
    				canvas_changes.$$scope = { dirty, ctx };
    			}

    			canvas.$set(canvas_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(canvas);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("RandomJenga", slots, []);
    	let cubeGeometry = new svelthree_mjs.BoxBufferGeometry(1, 1, 1);
    	let cubeMaterial = new svelthree_mjs.MeshStandardMaterial();
    	let floorGeometry = new svelthree_mjs.PlaneBufferGeometry(4, 4, 1);
    	let floorMaterial = new svelthree_mjs.MeshStandardMaterial();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RandomJenga> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Canvas: svelthree_mjs.Canvas,
    		Scene: svelthree_mjs.Scene,
    		PerspectiveCamera: svelthree_mjs.PerspectiveCamera,
    		DirectionalLight: svelthree_mjs.DirectionalLight,
    		PCFSoftShadowMap: svelthree_mjs.PCFSoftShadowMap,
    		AmbientLight: svelthree_mjs.AmbientLight,
    		BoxBufferGeometry: svelthree_mjs.BoxBufferGeometry,
    		PlaneBufferGeometry: svelthree_mjs.PlaneBufferGeometry,
    		Mesh: svelthree_mjs.Mesh,
    		MeshStandardMaterial: svelthree_mjs.MeshStandardMaterial,
    		WebGLRenderer: svelthree_mjs.WebGLRenderer,
    		OrbitControls: svelthree_mjs.OrbitControls,
    		DoubleSide: svelthree_mjs.DoubleSide,
    		MathUtils: svelthree_mjs.MathUtils,
    		cubeGeometry,
    		cubeMaterial,
    		floorGeometry,
    		floorMaterial
    	});

    	$$self.$inject_state = $$props => {
    		if ("cubeGeometry" in $$props) $$invalidate(0, cubeGeometry = $$props.cubeGeometry);
    		if ("cubeMaterial" in $$props) $$invalidate(1, cubeMaterial = $$props.cubeMaterial);
    		if ("floorGeometry" in $$props) $$invalidate(2, floorGeometry = $$props.floorGeometry);
    		if ("floorMaterial" in $$props) $$invalidate(3, floorMaterial = $$props.floorMaterial);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cubeGeometry, cubeMaterial, floorGeometry, floorMaterial];
    }

    class RandomJenga extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RandomJenga",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let dev6;
    	let h1;
    	let t0;
    	let t1;
    	let dev3;
    	let dev0;
    	let t2;
    	let dev0_class_value;
    	let t3;
    	let dev1;
    	let t4;
    	let dev1_class_value;
    	let t5;
    	let dev2;
    	let t6;
    	let dev2_class_value;
    	let t7;
    	let dev5;
    	let dev4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			dev6 = element("dev");
    			h1 = element("h1");
    			t0 = text(/*headlineString*/ ctx[1]);
    			t1 = space();
    			dev3 = element("dev");
    			dev0 = element("dev");
    			t2 = text("Some pilled Blocks");
    			t3 = space();
    			dev1 = element("dev");
    			t4 = text("A tiny sand simulation");
    			t5 = space();
    			dev2 = element("dev");
    			t6 = text("An interval timer");
    			t7 = space();
    			dev5 = element("dev");
    			dev4 = element("dev");
    			attr_dev(h1, "class", "headline svelte-ibk3el");
    			add_location(h1, file, 39, 4, 915);
    			attr_dev(dev0, "class", dev0_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].randomJenga + " svelte-ibk3el");
    			add_location(dev0, file, 42, 6, 999);
    			attr_dev(dev1, "class", dev1_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].sandSimulation + " svelte-ibk3el");
    			add_location(dev1, file, 49, 6, 1161);
    			attr_dev(dev2, "class", dev2_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].intervalTimer + " svelte-ibk3el");
    			add_location(dev2, file, 56, 6, 1333);
    			attr_dev(dev3, "class", "buttonContainer svelte-ibk3el");
    			add_location(dev3, file, 41, 4, 963);
    			add_location(dev4, file, 67, 6, 1607);
    			attr_dev(dev5, "class", "canvasContainer svelte-ibk3el");
    			add_location(dev5, file, 64, 4, 1507);
    			attr_dev(dev6, "class", "pageOrganiser svelte-ibk3el");
    			add_location(dev6, file, 38, 2, 883);
    			attr_dev(main, "class", "svelte-ibk3el");
    			add_location(main, file, 37, 0, 874);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, dev6);
    			append_dev(dev6, h1);
    			append_dev(h1, t0);
    			append_dev(dev6, t1);
    			append_dev(dev6, dev3);
    			append_dev(dev3, dev0);
    			append_dev(dev0, t2);
    			append_dev(dev3, t3);
    			append_dev(dev3, dev1);
    			append_dev(dev1, t4);
    			append_dev(dev3, t5);
    			append_dev(dev3, dev2);
    			append_dev(dev2, t6);
    			append_dev(dev6, t7);
    			append_dev(dev6, dev5);
    			append_dev(dev5, dev4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(dev0, "click", /*handleRandomJengaClick*/ ctx[4], false, false, false),
    					listen_dev(dev1, "click", /*handleSandSimulationClick*/ ctx[2], false, false, false),
    					listen_dev(dev2, "click", /*handleIntervalTimerClick*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*headlineString*/ 2) set_data_dev(t0, /*headlineString*/ ctx[1]);

    			if (dirty & /*activatedButtons*/ 1 && dev0_class_value !== (dev0_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].randomJenga + " svelte-ibk3el")) {
    				attr_dev(dev0, "class", dev0_class_value);
    			}

    			if (dirty & /*activatedButtons*/ 1 && dev1_class_value !== (dev1_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].sandSimulation + " svelte-ibk3el")) {
    				attr_dev(dev1, "class", dev1_class_value);
    			}

    			if (dirty & /*activatedButtons*/ 1 && dev2_class_value !== (dev2_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].intervalTimer + " svelte-ibk3el")) {
    				attr_dev(dev2, "class", dev2_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	let activatedButtons = {
    		intervalTimer: "",
    		sandSimulation: "",
    		randomJenga: ""
    	};

    	let headlineString = "Select a Doodle:";

    	function resetButtons() {
    		console.log(activatedButtons);

    		for (let button in activatedButtons) {
    			$$invalidate(0, activatedButtons[button] = "", activatedButtons);
    		}
    	}

    	function handleSandSimulationClick() {
    		resetButtons();
    		$$invalidate(0, activatedButtons.sandSimulation = "active", activatedButtons);
    		$$invalidate(1, headlineString = "Look at this Sand:");
    	}

    	function handleIntervalTimerClick() {
    		resetButtons();
    		$$invalidate(0, activatedButtons.intervalTimer = "active", activatedButtons);
    		$$invalidate(1, headlineString = "What a wonderful time:");
    	}

    	function handleRandomJengaClick() {
    		resetButtons();
    		$$invalidate(0, activatedButtons.randomJenga = "active", activatedButtons);
    		$$invalidate(1, headlineString = "...");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		IntervalTimer,
    		RandomJenga,
    		activatedButtons,
    		headlineString,
    		resetButtons,
    		handleSandSimulationClick,
    		handleIntervalTimerClick,
    		handleRandomJengaClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("activatedButtons" in $$props) $$invalidate(0, activatedButtons = $$props.activatedButtons);
    		if ("headlineString" in $$props) $$invalidate(1, headlineString = $$props.headlineString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		activatedButtons,
    		headlineString,
    		handleSandSimulationClick,
    		handleIntervalTimerClick,
    		handleRandomJengaClick
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}(svelthree_mjs));
//# sourceMappingURL=bundle.js.map
