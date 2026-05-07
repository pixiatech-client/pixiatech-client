#!/usr/bin/env bash
set -euo pipefail

APP_BASE_URL="https://app.buildbygrok.com"
PACKAGE_URL="https://install.buildbygrok.com/downloads/grok-build-latest.tgz"
CHECKSUM_URL="${PACKAGE_URL}.sha256"
RUN_LOGIN=0
RUN_LAUNCH=1
LAUNCH_MODE="terminal"

fail() {
	printf 'Build by Grok install failed: %s\n' "$1" >&2
	exit 1
}

usage() {
	cat <<EOF
Usage:
  curl -fsSL https://install.buildbygrok.com/install.sh | bash
  curl -fsSL https://install.buildbygrok.com/install.sh | bash -s -- --install-only

Flags:
  --install-only Install the CLI only and return to the shell
  --login    Install the CLI and immediately start browser-assisted login
  --launch   Install and launch Build by Grok in the current local folder
  --browser  Install, login, and start the browser-connected runtime in the current local folder
  -h, --help Show this help text

Notes:
  Run the one-line install from the folder you want the brain tied to.
  The default one-line install installs the CLI and lands in grok> in that current folder.
  The CLI installs locally on your machine and does not connect GitHub by itself.
  Build by Grok uses the current local folder as the repo root when you start it.
  Run /login later only when you want the web workspace or GitHub-connected features.
  Git is optional unless you want git-specific flows like bootstrap, branch publish, or GitHub-connected workspace work.
EOF
}

need_cmd() {
	command -v "$1" >/dev/null 2>&1 || fail "$1 is required."
}

has_cmd() {
	command -v "$1" >/dev/null 2>&1
}

run_cli_with_tty() {
	if [ ! -r /dev/tty ] || [ ! -w /dev/tty ]; then
		fail "interactive CLI launch requires a terminal."
	fi

	"$@" </dev/tty >/dev/tty 2>/dev/tty
}

resolve_cli_bin() {
	if command -v grok-build >/dev/null 2>&1; then
		command -v grok-build
		return
	fi

	prefix="$(npm config get prefix 2>/dev/null || npm prefix -g 2>/dev/null || true)"
	root="$(npm root -g 2>/dev/null || true)"

	for candidate in \
		"${prefix}/bin/grok-build" \
		"${prefix}/grok-build" \
		"${prefix}/lib/node_modules/grok-build/dist/index.js" \
		"${prefix}/node_modules/grok-build/dist/index.js" \
		"${root}/../bin/grok-build" \
		"${root}/grok-build/dist/index.js"
	do
		if [ -n "${candidate}" ] && [ -x "${candidate}" ]; then
			printf '%s\n' "${candidate}"
			return
		fi
	done
	return 1
}

print_cli_path_notice() {
	prefix="$(npm config get prefix 2>/dev/null || npm prefix -g 2>/dev/null || true)"
	if [ -n "${prefix}" ]; then
		cat <<EOF

Note:
  The CLI installed successfully, but your current shell cannot see grok-build yet.
  Run:
    export PATH="${prefix}/bin:\$PATH"
  Or use:
    ${prefix}/bin/grok-build
EOF
		return
	fi

	cat <<EOF

Note:
  The CLI installed successfully, but your current shell cannot see grok-build yet.
  Open a new shell and run grok-build again.
EOF
}

run_cli_command() {
	cli_bin="${1:-}"
	shift || true

	if [ -n "${cli_bin}" ] && [ -x "${cli_bin}" ]; then
		run_cli_with_tty "${cli_bin}" "$@"
		return
	fi

	if [ -f "${PACKAGE_FILE}" ]; then
		run_cli_with_tty npx --yes "${PACKAGE_FILE}" "$@"
		return
	fi

	fail "grok-build was installed but is not available on PATH. Open a new shell or run it from your npm global bin."
}

open_url() {
	url="${1:-}"
	if [ -z "${url}" ]; then
		return 1
	fi

	if command -v xdg-open >/dev/null 2>&1; then
		xdg-open "${url}" >/dev/null 2>&1 &
		return 0
	fi

	if command -v open >/dev/null 2>&1; then
		open "${url}" >/dev/null 2>&1 &
		return 0
	fi

	if command -v cmd.exe >/dev/null 2>&1; then
		cmd.exe /c start "" "${url}" >/dev/null 2>&1
		return 0
	fi

	return 1
}

open_app_surface() {
	app_url="${APP_BASE_URL}/app/"
	printf '\nOpening the Build by Grok app...\n'
	if open_url "${app_url}"; then
		printf 'Opened %s\n' "${app_url}"
		return
	fi

	cat <<EOF
Open this URL in your browser:
  ${app_url}
EOF
}

run_onboarding_flow() {
	cli_bin="$1"

	if [ "${RUN_LOGIN}" -eq 1 ]; then
		printf '\nStarting Build by Grok login...\n'
		run_cli_command "${cli_bin}" login --base-url "${APP_BASE_URL}"
	fi

	if [ "${RUN_LAUNCH}" -ne 1 ]; then
		return
	fi

	if [ "${LAUNCH_MODE}" = "browser" ]; then
		printf '\nLaunching browser-connected local runtime...\n'
		run_cli_command "${cli_bin}" run --base-url "${APP_BASE_URL}"
		return
	fi

	printf '\nLaunching Build by Grok in the current local folder...\n'
	run_cli_command "${cli_bin}" --base-url "${APP_BASE_URL}"
}

while [ $# -gt 0 ]; do
	case "$1" in
		--install-only)
			RUN_LOGIN=0
			RUN_LAUNCH=0
			;;
		--login)
			RUN_LOGIN=1
			RUN_LAUNCH=0
			;;
		--launch)
			RUN_LOGIN=0
			RUN_LAUNCH=1
			LAUNCH_MODE="terminal"
			;;
		--browser)
			RUN_LOGIN=1
			RUN_LAUNCH=1
			LAUNCH_MODE="browser"
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			fail "Unknown option: $1"
			;;
	esac
	shift
done

need_cmd node
need_cmd npm
need_cmd curl

TMPDIR="$(mktemp -d)"
trap 'rm -rf "${TMPDIR}"' EXIT

PACKAGE_FILE="${TMPDIR}/grok-build-latest.tgz"
CHECKSUM_FILE="${TMPDIR}/grok-build-latest.tgz.sha256"

sha256_check_cmd() {
	if command -v sha256sum >/dev/null 2>&1; then
		printf 'sha256sum'
		return
	fi

	if command -v shasum >/dev/null 2>&1; then
		printf 'shasum -a 256'
		return
	fi

	fail "sha256sum or shasum is required."
}

verify_checksum() {
	check_cmd="$(sha256_check_cmd)"
	if [ "${check_cmd}" = "sha256sum" ]; then
		(
			cd "${TMPDIR}"
			sha256sum -c "${CHECKSUM_FILE}"
		) >/dev/null
		return
	fi

	expected="$(awk '{print $1}' "${CHECKSUM_FILE}")"
	actual="$(shasum -a 256 "${PACKAGE_FILE}" | awk '{print $1}')"
	[ "${expected}" = "${actual}" ] || fail "checksum verification failed."
}

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"

if [ "${NODE_MAJOR}" -lt 20 ]; then
	fail "Node.js 20 or newer is required. Found $(node -v)."
fi

printf 'Installing Build by Grok CLI from %s\n' "${PACKAGE_URL}"
curl -fsSL "${PACKAGE_URL}" -o "${PACKAGE_FILE}"
curl -fsSL "${CHECKSUM_URL}" -o "${CHECKSUM_FILE}"
verify_checksum
npm install -g "${PACKAGE_FILE}"

NPM_GLOBAL_PREFIX="$(npm config get prefix 2>/dev/null || npm prefix -g 2>/dev/null || true)"
if [ -n "${NPM_GLOBAL_PREFIX}" ] && [ -d "${NPM_GLOBAL_PREFIX}/bin" ]; then
	export PATH="${NPM_GLOBAL_PREFIX}/bin:${PATH}"
fi

CLI_BIN="$(resolve_cli_bin || true)"

if [ "${RUN_LOGIN}" -eq 1 ] || [ "${RUN_LAUNCH}" -eq 1 ]; then
	run_onboarding_flow "${CLI_BIN}"
	exit 0
fi

cat <<EOF

Build by Grok CLI installed locally.

Next:
  Run these from the folder you want the brain tied to.
  grok-build --base-url ${APP_BASE_URL}
  grok-build login --base-url ${APP_BASE_URL}
  grok-build run --base-url ${APP_BASE_URL}
  grok-build open --base-url ${APP_BASE_URL}
  mkdir empty-folder && cd empty-folder && grok-build init --base-url ${APP_BASE_URL}

Single command install + launch:
  curl -fsSL https://install.buildbygrok.com/install.sh | bash

Install only:
  curl -fsSL https://install.buildbygrok.com/install.sh | bash -s -- --install-only

Need the GitHub bootstrap step?
  grok-build init --base-url ${APP_BASE_URL}

App host:
  ${APP_BASE_URL}

EOF

if [ -z "${CLI_BIN}" ]; then
	print_cli_path_notice
fi
