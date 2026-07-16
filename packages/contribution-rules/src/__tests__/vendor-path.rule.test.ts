/**
 * Unit tests: VendorPathRule
 */

import { describe, it, expect } from "vitest";
import { VendorPathRule } from "../rules/vendor-path.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("VendorPathRule", () => {
  const rule = new VendorPathRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("VENDOR_PATH");
  });

  describe("vendor directory prefixes", () => {
    const vendorPaths = [
      "vendor/github.com/pkg/errors/errors.go",
      "vendors/lodash/index.js",
      "node_modules/react/index.js",
      "third_party/abseil/hash.cc",
      "third-party/openssl/ssl.c",
      "thirdparty/zlib/inflate.c",
      "external/protobuf/descriptor.proto",
      "externals/unity/Runtime/Export.cs",
      "deps/libuv/src/unix/core.c",
      "dependencies/some-lib/index.js",
      "lib/vendor/jquery.js",
      "Pods/AFNetworking/AFNetworking.h",
      ".bundle/ruby/gems/rails/actionpack.rb",
      "bower_components/bootstrap/dist/css/bootstrap.css",
      "jspm_packages/npm/lodash@4.17.21/lodash.js",
    ];

    for (const path of vendorPaths) {
      it(`excludes "${path}"`, () => {
        const result = rule.evaluate(makeFile({ path }), ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("excluded");
        expect(result!.matched).toBe(true);
        expect(result!.ruleId).toBe("VENDOR_PATH");
      });
    }

    it("excludes a vendor directory nested in a package", () => {
      // e.g. packages/core/vendor/some-lib/index.js
      const result = rule.evaluate(
        makeFile({ path: "packages/core/vendor/some-lib/index.js" }),
        ctx,
      );
      expect(result?.decision).toBe("excluded");
    });

    it("handles paths with a leading slash", () => {
      const result = rule.evaluate(makeFile({ path: "/vendor/some-lib.js" }), ctx);
      expect(result?.decision).toBe("excluded");
    });
  });

  describe("non-vendor paths pass through", () => {
    it("does not exclude a normal source file", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.ts" }), ctx)).toBeNull();
    });

    it("does not exclude a file with 'vendor' in the name but not the directory", () => {
      // A source file that happens to mention vendor in its own name
      expect(rule.evaluate(makeFile({ path: "src/vendor-config.ts" }), ctx)).toBeNull();
    });

    it("does not exclude lib/index.ts (only lib/vendor/ is matched)", () => {
      expect(rule.evaluate(makeFile({ path: "lib/index.ts" }), ctx)).toBeNull();
    });

    it("does not exclude node_modules-style path where it's in the file name only", () => {
      expect(
        rule.evaluate(makeFile({ path: "scripts/install-node_modules.sh" }), ctx),
      ).toBeNull();
    });
  });
});
