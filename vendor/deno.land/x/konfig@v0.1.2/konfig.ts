import {
  array,
  compose,
  DecodeError,
  Decoder,
  keyErr,
  leafErr,
  manyErr,
  string,
  success,
} from "https://deno.land/x/fun@v.2.0.0-alpha.11/decoder.ts";
import { flow, Fn, pipe } from "https://deno.land/x/fun@v.2.0.0-alpha.11/fn.ts";
import { parse as parseFlags } from "std/flags/mod.ts";
import {
  alt,
  chain,
  Either,
  left,
  mapLeft,
  MonadEither,
  right,
  tryCatch,
} from "https://deno.land/x/fun@v.2.0.0-alpha.11/either.ts";
import {
  lookupAt,
  map,
  sequence,
} from "https://deno.land/x/fun@v.2.0.0-alpha.11/record.ts";
import { match } from "https://deno.land/x/fun@v.2.0.0-alpha.11/option.ts";
import {
  lookup,
  reduce,
} from "https://deno.land/x/fun@v.2.0.0-alpha.11/array.ts";
import { FnEither } from "https://deno.land/x/fun@v.2.0.0-alpha.11/fn_either.ts";

const sequenceStruct = sequence(MonadEither);

/**
 * Represents an ENV variable
 */
export interface Env<A, B extends unknown = Record<string, unknown>> {
  _tag: "Env";
  read: FnEither<B, DecodeError, A>;
}

/**
 * Represents a `--flag` argument
 */
export interface Flag<A, B extends unknown = string[]> {
  _tag: "Flag";
  read: FnEither<B, DecodeError, A>;
}

/**
 * Represents an `<nth>` argument
 */
export interface Positional<A, B extends unknown = string[]> {
  _tag: "Positional";
  read: FnEither<B, DecodeError, A>;
}

/**
 * Represents a default value if the parser fails
 */
export interface Fallback<A, B extends unknown = {}> {
  _tag: "Fallback";
  read: FnEither<B, DecodeError, A>;
}

/**
 * Try multiple parsers until one succeeds
 */
export interface Pipeline<A, B extends unknown = {}> {
  _tag: "Pipeline";
  read: FnEither<B, DecodeError, A>;
}

/**
 * Use a function, which has access to already parased values.
 */
export interface Interpolation<A> {
  _tag: "Interpolation";
  read: FnEither<unknown, DecodeError, A>;
}

export type Schema<A, D = unknown> = {
  _tag: "Schema";
  read: () => Either<DecodeError, { [K in keyof A]: A[K] }>;
  // | ((d: D) => Either<DecodeError, { [K in keyof A]: A[K] }>);
  props: { [K in keyof A]: Parser<A[K]> };
};
export type Parser<A, D extends unknown = any> =
  | Env<A, D>
  | Flag<A, D>
  | Pipeline<A, D>
  | Interpolation<A>
  | Fallback<A, D>
  | Schema<A>;

export type Konfig<A> = A extends Parser<infer B> ? B : never;

// Error
export const missingKey = flow(leafErr, left);

// Read from Deno.env
export function env<A = string>(
  variable: string,
  decoder = <Decoder<unknown, A>> string,
): Env<A> {
  const missingEnv = missingKey(variable, "Missing environment variable");

  const read = flow(
    lookupAt(variable),
    match(
      () => missingEnv,
      (a) => right(a),
    ),
    chain(decoder),
  );
  return {
    _tag: "Env",
    read,
  };
}

// Read from Deno.args
export function flag<A = string>(
  name: string,
  decoder = <Decoder<unknown, A>> string,
): Flag<A> {
  const missingArg = missingKey(name, "Missing argument");
  const read = flow(
    (args: string[]) => parseFlags(args, { "--": true }),
    lookupAt(name),
    match(
      () => missingArg,
      (a: A) => right(a),
    ),
    chain(decoder),
  );
  return {
    _tag: "Flag",
    read,
  };
}

// Parser for nth argument e.g. `deno run x.ts <first-arg>` (independent of flags)
export const nth = <A = string>(
  pos: number,
  decoder = <Decoder<unknown, A>> string,
): Positional<A> => {
  const idx = pos - 1;
  const missingPos = missingKey(
    pos,
    `Missing positional argument: pos: ${pos} / idx ${idx}`,
  );
  const read = pipe(
    array(string),
    compose(
      flow(
        lookup(pos - 1),
        match(
          () => missingPos,
          (a) => right(a),
        ),
        chain(decoder),
      ),
    ),
    (decoder) => flag("_", decoder),
    (parser) => parser.read,
  );
  return {
    _tag: "Positional",
    read,
  };
};

// Fallback in case there's no value
export function fallback<A = any>(value: A): Fallback<A> {
  return {
    _tag: "Fallback",
    read: () => success(value),
  };
}

export function schema<A>(
  props: Readonly<{ [K in keyof A]: Parser<A[K]> }>,
): Schema<A> {
  const decodeErrors: DecodeError[] = [];
  const read = () =>
    pipe(
      props,
      map((parser: Parser<A[keyof A]>, prop) =>
        pipe(
          parser,
          run,
          mapLeft((e) => {
            const err = keyErr(prop, e, "required");
            decodeErrors.push(err);
            return err;
          }),
        )
      ),
      (props) =>
        sequenceStruct(props) as Either<DecodeError, { [K in keyof A]: A[K] }>,
      mapLeft(() =>
        manyErr(
          ...(decodeErrors as [DecodeError, DecodeError, ...DecodeError[]]),
        )
      ),
    );
  return {
    _tag: "Schema",
    props,
    read,
  };
}

// compose
export function pipeline<A>(...parsers: Parser<A>[]): Pipeline<A> {
  const read = () =>
    pipe(
      parsers,
      reduce(
        (acc, parser) => pipe(parser, run, alt, (or) => or(acc)),
        left<DecodeError, A>(leafErr("compose", "No parsers matched")),
      ),
    );
  return {
    _tag: "Pipeline",
    read,
  };
}

// interpolate over a schema
export function interpolation<S extends Schema<any>, A>(
  fn: Fn<Konfig<S>, A>,
  decoder = <Decoder<unknown, A>> string,
): Fn<S, Interpolation<A>> {
  const evaluateFn = (a: any): Either<DecodeError, A> =>
    tryCatch(
      () => fn(a),
      (e) => leafErr("interpolation", `Failed to interpolate: ${String(e)}`),
    );
  return (schema) => ({
    _tag: "Interpolation",
    read: () => pipe(schema, run, chain(evaluateFn), chain(decoder)),
  });
}

export function run<A>({ _tag, read }: Parser<A>): Either<DecodeError, A> {
  switch (_tag) {
    case "Env":
      return pipe(Deno.env.toObject(), read);
    case "Flag":
      return pipe(Deno.args, read);
    default:
      return read({});
  }
}

export function prop<P extends string, A, B>(prop: P, parser: Parser<A>) {
  return ({
    props,
  }: Schema<B>): Schema<
    {
      [K in keyof B | P]: K extends keyof B ? B[K] : A;
    }
  > => {
    props = { ...props, [prop]: parser };
    return schema(props) as Schema<
      {
        [K in keyof B | P]: K extends keyof B ? B[K] : A;
      }
    >;
  };
}

export function bind<P extends string, A, B>(property: P, fn: (b: B) => A) {
  return (
    s: Schema<B>,
  ): Schema<{ [K in keyof B | P]: K extends keyof B ? B[K] : A }> => {
    const parser = interpolation(fn)(s);
    return prop(property, parser)(s) as Schema<
      {
        [K in keyof B | P]: K extends keyof B ? B[K] : A;
      }
    >;
  };
}
