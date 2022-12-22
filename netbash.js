let netbash = {
	new(div_id, conf) {
		netbash.consoles.push({ fg: "white", bg: "black", stdin: [""], stdout: [""], active: false, in_program: false, readln_run: false, cursor_blink: 0, cursor_pos: 0, stdin_entry: 0, new_stdin_entries: 0, env: { EXIT: 0 } })
		let x = netbash.consoles[netbash.consoles.length - 1]
		x.id = `netbash_console${netbash.consoles.length - 1}`
		x.conf = conf
		x.font = conf.font
		x.font_size = conf.font_size
		x.env.PS1 = conf.prompt
		x.canvas = document.createElement('canvas')
		x.canvas.id = `netbash_console_disp${netbash.consoles.length - 1}`
		x.canvas.width = conf.width
		x.canvas.height = conf.height
		document.getElementById(div_id).appendChild(x.canvas)
		x.ctx = x.canvas.getContext('2d')
		x.ctx.fillStyle = x.fg
		x.ctx.fillRect(0, 0, x.canvas.width, x.canvas.height)
		x.write = function(str) {
			let list = str.split(/(?<=\n)|(?=\n)/)
			for (let i = 0; i < list.length; i++) {
				if (list[i] === "\n") {
					x.stdout.push("")
				}
				else {
					x.stdout[x.stdout.length - 1] += list[i]
				}
			}
		}
		x.writeln = function(str) {
			x.write(str)
			x.stdout.push("")
		}
		x.gather_stdin = function() {
			let out = ""
			for (let i = x.stdin.length - x.new_stdin_entries - 1; i < x.stdin.length; i++) {
				out = out.concat(x.stdin[i])
				if (i != x.stdin.length - 1) {
					out = out.concat("\n")
				}
			}
			return out
		}
		x.flush = function() {
			x.stdin.push("")
		}
		/*x.readln = function() {
			x.readln_run = true
			let out = x.gather_stdin()
			while (out.length === 0) {
				draw()
				out = x.gather_stdin()
			}
			x.flush()
			return out
		}*/
		x.reset = function() {
			x.fg = "white"
			x.bg = "black"
			x.stdin = [""]
			x.stdout = [""]
			x.in_program = false
			x.new_stdin_entries = 0
			x.stdin_entry = 0
			x.env = { EXIT: 0 }
			x.font = conf.font
			x.font_size = conf.font_size
			x.env.PS1 = conf.prompt
			x.canvas.width = conf.width
			x.canvas.height = conf.height
			x.ctx = x.canvas.getContext('2d')
			x.ctx.fillStyle = x.fg
			x.ctx.fillRect(0, 0, x.canvas.width, x.canvas.height)
		}
		x.check_for_enter = function() {
			return x.new_stdin_entries > 1
		}
		x.clear_screen = function() {
			x.stdout = [""]
		}
		return x
	},
	consoles: []
}

function draw() {
	for (let i = 0; i < netbash.consoles.length; i++) {
		let x = netbash.consoles[i]
		x.ctx.fillStyle = x.bg
		x.ctx.fillRect(0, 0, x.canvas.width, x.canvas.height)
		x.ctx.fillStyle = x.fg
		let spacing = x.font_size / 6 * 10
		let down = 0
		let max_lines = Math.ceil(x.canvas.height / (x.font_size * 2))
		for (let j = x.stdout.length - max_lines; j < x.stdout.length; j++) {
			if (j < 0) {
				continue
			}
			let out = [""]
			let colors = [x.fg]
			let list = x.stdout[j].split(/(?<=\033\[\dm|\033\[\d;\d\dm)|(?=\033\[\dm|\033\[\d;\d\dm)/)
			for (let k = 0; k < list.length; k++) {
				if (list[k].includes("\033")) {
					let sublist = list[k].split(/\033\[|;|m/).filter(item => item !== "")
					if (sublist.length > 1) {
						switch (parseInt(sublist[1])) {
							case 30:
								x.fg = "black"
								break
							case 31:
								x.fg = "red"
								break
							case 32:
								x.fg = "green"
								break
							case 33:
								x.fg = "yellow"
								break
							case 34:
								x.fg = "blue"
								break
							case 35:
								x.fg = "purple"
								break
							case 36:
								x.fg = "cyan"
								break
							default:
								x.fg = "white"
								break
						}
					}
					else {
						x.fg = "white"
					}
					out.push("")
					colors.push(x.fg)
				}
				else {
					out[out.length - 1] += list[k]
				}
			}
			let push = 0
			for (let k = 0; k < out.length; k++) {
				x.ctx.font = `${x.font_size}px ${x.font}, ${colors[k]}`
				x.ctx.fillStyle = colors[k]
				x.ctx.fillText(out[k], x.font_size + push, spacing * down + spacing)
				push += out[k].length
			}
			down++
		}
		if (!x.in_program) {
			x.ctx.fillText(x.env.PS1 + x.stdin[x.stdin_entry], x.font_size + (x.font_size / 1.82 * x.stdout[x.stdout.length - 1].length), spacing * (down - 1) + spacing)
			if (x.cursor_blink < 1) {
				x.ctx.fillRect(x.font_size + (x.font_size / 2 * (x.cursor_pos + x.env.PS1.length + x.stdout[x.stdout.length - 1].length)) * 1.10, spacing * (down - 1) + spacing / 2, 1, x.font_size)
			}
		}
		else {
			x.ctx.fillText(x.stdin[x.stdin.length - 1], x.font_size + (x.font_size / 1.82 * x.stdout[x.stdout.length - 1].length), spacing * (down - 1) + spacing)
			if (x.cursor_blink < 1) {
				x.ctx.fillRect(x.font_size + (x.font_size / 2 * (x.cursor_pos + x.stdout[x.stdout.length - 1].length)) * 1.10, spacing * (down - 1) + spacing / 2, 1, x.font_size)
			}
		}
	}
}

function cursor_blink() {
	for (let i = 0; i < netbash.consoles.length; i++) {
		let x = netbash.consoles[i]
		if (x.cursor_blink < 1) {
			x.cursor_blink++
		}
		else {
			x.cursor_blink--
		}
	}
}

setInterval(draw, 10);
setInterval(cursor_blink, 600)

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("click", activateConsole, false);

function keyDownHandler(e) {
	for (let i = 0; i < netbash.consoles.length; i++) {
		let x = netbash.consoles[i]
		if (x.active) {
			if (e.key === "Enter") {
				x.new_stdin_entries += 1
				if (!x.in_program) {
					x.writeln(x.env.PS1 + x.stdin[x.stdin_entry])
					x.env.EXIT = exec(x, x.stdin[x.stdin_entry])
					x.new_stdin_entries -= 1;
				}
				else {
					x.writeln(x.stdin[x.stdin.length - 1])
					
				}
				x.stdin_entry = x.stdin.length
				x.cursor_pos = 0
				x.flush()
			}
			else if (e.key === "Backspace") {
				if (x.stdin_entry !== x.stdin.length - 1) {
					x.stdin[x.stdin.length - 1] = x.stdin[x.stdin_entry]
					x.stdin_entry = x.stdin.length - 1
				}
				x.stdin[x.stdin_entry] = x.stdin[x.stdin_entry].slice(0, x.cursor_pos).slice(0, -1) + x.stdin[x.stdin_entry].slice(x.cursor_pos)
				if (x.cursor_pos > 0) {
					x.cursor_pos--
				}
			}
			else if (e.key === "Shift") {

			}
			else if (e.key === "ArrowUp") {
				if (!x.in_program && x.stdin_entry > 0) {
					x.stdin_entry--
					x.cursor_pos = x.stdin[x.stdin_entry].length
				}
			}
			else if (e.key === "ArrowDown") {
				if (!x.in_program && x.stdin_entry < x.stdin.length - 1) {
					x.stdin_entry++
					x.cursor_pos = x.stdin[x.stdin_entry].length
				}
			}
			else if (e.key === "ArrowLeft") {
				if (x.cursor_pos > 0) {
					x.cursor_pos--
				}
			}
			else if (e.key === "ArrowRight") {
				if (x.cursor_pos < x.stdin[x.stdin_entry].length) {
					x.cursor_pos++
				}
			}
			else {
				if (x.stdin_entry !== x.stdin.length - 1) {
					x.stdin[x.stdin.length - 1] = x.stdin[x.stdin_entry]
					x.stdin_entry = x.stdin.length - 1
				}
				x.stdin[x.stdin_entry] = x.stdin[x.stdin_entry].slice(0, x.cursor_pos) + e.key + x.stdin[x.stdin_entry].slice(x.cursor_pos)
				x.cursor_pos++
			}
		}
	}
}

function activateConsole(e) {
	for (let i = 0; i < netbash.consoles.length; i++) {
		let x = netbash.consoles[i]
		if (e.target.id === x.canvas.id) {
			x.active = true;
		}
		else {
			x.active = false;
		}
	}
}

window.addEventListener('keydown', function(e) {
  	for (let i = 0; i < vConsole.engineStatus.contains; i++) {
		if (vConsole.engineStatus[`console${i}`].active) {
			e.preventDefault();
		}
	}
})

function exec(x, command) {
	let list = command.split(" ")
	let com = list[0]
	let args = list.slice(1, list.length)
	if (com === "echo") {
		for (let i = 0; i < args.length; i++) {
			x.write(args[i] + " ")
		}
		x.writeln("")
	}
	else if (com === "version") {
		x.writeln("NETBASH v0.1.0")
	}
	else if (com === "help") {
		x.writeln("NETBASH Integrated commands:")
		x.writeln("echo <expression>: prints back the result of expression")
		x.writeln("version: prints the version of netbash you are using")
		x.writeln("help: prints this menu")
	}
	else if (com === "reset") {
		x.reset()
	}
	else if (com === "anger") {
		x.writeln("it no work >>:/")
	}
	else if (com === "this") {
		if (args[0] !== "is") {
			x.writeln(`netbash: Command not found: ${com}`)
			return 1
		}
		if (args[1] !== "madness") {
			x.writeln(`netbash: Command not found: ${com}`)
			return 1
		}
		x.writeln("THIS")
		x.writeln("IS")
		x.writeln("NETBASH")
	}
	else if (com === "whois") {
		if (args[0] === "Ayla" || args[0] === "Aywa") {
			x.writeln("Foxy's unofficial sister :3")
		}
		else if (args[0] === "Minty" || args[0] === "Mintie") {
			x.writeln("Foxy's best friend :>")
		}
		else if (args[0] === "Foxy" || args[0] === "Fwoxie") {
			x.writeln("My creator")
		}
		else if (args[0] === "Bruno") {
			x.writeln("We don't talk about Bruno")
		}
		else {
			x.writeln("no clue")
		}
	}
	else if (com === "obvious_easter_egg") {
		x.writeln("it is isn't it")
	}
	else if (com === ":>" || com === ":3") {
		x.writeln(":3")
	}
	else if (com === "UwU" || com === "OwO") {
		x.writeln("UwU")
	}
	else if (com === "tohex") {
		x.writeln("NOT IMPLEMENTED!")
	}
	else {
		let did_something = false
		// programs
		if (!did_something) {
			x.writeln(`netbash: Command not found: ${com}`)
			return 1
		}
	}
	return 0
}

function settings(x) {
	x.in_program = true
	x.clear_screen()
	writeln("")
	// need readln :<
}