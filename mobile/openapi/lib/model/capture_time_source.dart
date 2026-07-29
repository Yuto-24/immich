//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Source of the effective asset capture time
class CaptureTimeSource {
  /// Instantiate a new enum with the provided [value].
  const CaptureTimeSource._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const embeddedExif = CaptureTimeSource._(r'embedded-exif');
  static const embeddedQuicktime = CaptureTimeSource._(r'embedded-quicktime');
  static const xmpSidecar = CaptureTimeSource._(r'xmp-sidecar');
  static const manual = CaptureTimeSource._(r'manual');
  static const filesystem = CaptureTimeSource._(r'filesystem');
  static const unknown = CaptureTimeSource._(r'unknown');

  /// List of all possible values in this [enum][CaptureTimeSource].
  static const values = <CaptureTimeSource>[
    embeddedExif,
    embeddedQuicktime,
    xmpSidecar,
    manual,
    filesystem,
    unknown,
  ];

  static CaptureTimeSource? fromJson(dynamic value) => CaptureTimeSourceTypeTransformer().decode(value);

  static List<CaptureTimeSource> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CaptureTimeSource>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CaptureTimeSource.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CaptureTimeSource] to String,
/// and [decode] dynamic data back to [CaptureTimeSource].
class CaptureTimeSourceTypeTransformer {
  factory CaptureTimeSourceTypeTransformer() => _instance ??= const CaptureTimeSourceTypeTransformer._();

  const CaptureTimeSourceTypeTransformer._();

  String encode(CaptureTimeSource data) => data.value;

  /// Decodes a [dynamic value][data] to a CaptureTimeSource.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CaptureTimeSource? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'embedded-exif': return CaptureTimeSource.embeddedExif;
        case r'embedded-quicktime': return CaptureTimeSource.embeddedQuicktime;
        case r'xmp-sidecar': return CaptureTimeSource.xmpSidecar;
        case r'manual': return CaptureTimeSource.manual;
        case r'filesystem': return CaptureTimeSource.filesystem;
        case r'unknown': return CaptureTimeSource.unknown;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CaptureTimeSourceTypeTransformer] instance.
  static CaptureTimeSourceTypeTransformer? _instance;
}

