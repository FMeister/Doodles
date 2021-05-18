
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
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

    const file$1 = "src/IntervalTimer.svelte";

    function create_fragment$1(ctx) {
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
    			t0 = text(/*elapsedHours*/ ctx[1]);
    			t1 = text(" h ");
    			t2 = text(/*elapsedMinutes*/ ctx[3]);
    			t3 = text(" min ");
    			t4 = text(/*elapsedSecounds*/ ctx[2]);
    			t5 = text(" sec ");
    			t6 = text(/*elapsedMilisecounds*/ ctx[0]);
    			t7 = text("milisec");
    			t8 = space();
    			dev1 = element("dev");
    			dev1.textContent = "Start";
    			t10 = space();
    			dev2 = element("dev");
    			dev2.textContent = "Stop";
    			add_location(dev0, file$1, 33, 2, 727);
    			add_location(dev1, file$1, 36, 2, 837);
    			add_location(dev2, file$1, 37, 2, 874);
    			add_location(main, file$1, 32, 0, 718);
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
    			if (dirty & /*elapsedHours*/ 2) set_data_dev(t0, /*elapsedHours*/ ctx[1]);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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
    		$$invalidate(1, elapsedHours = floor(elapsedTime / (60 * 60 * 1000)));
    		elapsedTime -= elapsedHours * (60 * 60 * 1000);
    		$$invalidate(0, elapsedMilisecounds = elapsedTime - floor(elapsedTime / 1000) * 1000);

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
    		if ("elapsedSecounds" in $$props) $$invalidate(2, elapsedSecounds = $$props.elapsedSecounds);
    		if ("elapsedMinutes" in $$props) $$invalidate(3, elapsedMinutes = $$props.elapsedMinutes);
    		if ("elapsedHours" in $$props) $$invalidate(1, elapsedHours = $$props.elapsedHours);
    		if ("stopCounting" in $$props) stopCounting = $$props.stopCounting;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		elapsedMilisecounds,
    		elapsedHours,
    		elapsedSecounds,
    		elapsedMinutes,
    		start,
    		stop
    	];
    }

    class IntervalTimer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IntervalTimer",
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
    	let dev5;
    	let h1;
    	let t0;
    	let t1;
    	let dev2;
    	let dev0;
    	let t2;
    	let dev0_class_value;
    	let t3;
    	let dev1;
    	let t4;
    	let dev1_class_value;
    	let t5;
    	let dev4;
    	let intervaltimer;
    	let t6;
    	let dev3;
    	let current;
    	let mounted;
    	let dispose;
    	intervaltimer = new IntervalTimer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			dev5 = element("dev");
    			h1 = element("h1");
    			t0 = text(/*headlineString*/ ctx[1]);
    			t1 = space();
    			dev2 = element("dev");
    			dev0 = element("dev");
    			t2 = text("A tiny sand simulation");
    			t3 = space();
    			dev1 = element("dev");
    			t4 = text("An interval timer");
    			t5 = space();
    			dev4 = element("dev");
    			create_component(intervaltimer.$$.fragment);
    			t6 = space();
    			dev3 = element("dev");
    			attr_dev(h1, "class", "headline svelte-ibk3el");
    			add_location(h1, file, 28, 4, 697);
    			attr_dev(dev0, "class", dev0_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].sandSimulation + " svelte-ibk3el");
    			add_location(dev0, file, 31, 6, 781);
    			attr_dev(dev1, "class", dev1_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].intervalTimer + " svelte-ibk3el");
    			add_location(dev1, file, 38, 6, 953);
    			attr_dev(dev2, "class", "buttonContainer svelte-ibk3el");
    			add_location(dev2, file, 30, 4, 745);
    			add_location(dev3, file, 48, 6, 1187);
    			attr_dev(dev4, "class", "canvasContainer svelte-ibk3el");
    			add_location(dev4, file, 46, 4, 1127);
    			attr_dev(dev5, "class", "pageOrganiser svelte-ibk3el");
    			add_location(dev5, file, 27, 2, 665);
    			attr_dev(main, "class", "svelte-ibk3el");
    			add_location(main, file, 26, 0, 656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, dev5);
    			append_dev(dev5, h1);
    			append_dev(h1, t0);
    			append_dev(dev5, t1);
    			append_dev(dev5, dev2);
    			append_dev(dev2, dev0);
    			append_dev(dev0, t2);
    			append_dev(dev2, t3);
    			append_dev(dev2, dev1);
    			append_dev(dev1, t4);
    			append_dev(dev5, t5);
    			append_dev(dev5, dev4);
    			mount_component(intervaltimer, dev4, null);
    			append_dev(dev4, t6);
    			append_dev(dev4, dev3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(dev0, "click", /*handleSandSimulationClick*/ ctx[2], false, false, false),
    					listen_dev(dev1, "click", /*handleIntervalTimerClick*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*headlineString*/ 2) set_data_dev(t0, /*headlineString*/ ctx[1]);

    			if (!current || dirty & /*activatedButtons*/ 1 && dev0_class_value !== (dev0_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].sandSimulation + " svelte-ibk3el")) {
    				attr_dev(dev0, "class", dev0_class_value);
    			}

    			if (!current || dirty & /*activatedButtons*/ 1 && dev1_class_value !== (dev1_class_value = "doodleButton " + /*activatedButtons*/ ctx[0].intervalTimer + " svelte-ibk3el")) {
    				attr_dev(dev1, "class", dev1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(intervaltimer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(intervaltimer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(intervaltimer);
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
    	let activatedButtons = { intervalTimer: "", sandSimulation: "" };
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		IntervalTimer,
    		activatedButtons,
    		headlineString,
    		resetButtons,
    		handleSandSimulationClick,
    		handleIntervalTimerClick
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
    		handleIntervalTimerClick
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
    	target: document.body,
    	// props: {
    	// 	name: 'world'
    	// }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
