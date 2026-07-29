//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Asset provenance classification
class AssetProvenance {
  /// Instantiate a new enum with the provided [value].
  const AssetProvenance._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const cameraOriginal = AssetProvenance._(r'camera-original');
  static const scannerOriginal = AssetProvenance._(r'scanner-original');
  static const unknown = AssetProvenance._(r'unknown');
  static const cameraDerived = AssetProvenance._(r'camera-derived');
  static const screenshot = AssetProvenance._(r'screenshot');
  static const generated = AssetProvenance._(r'generated');

  /// List of all possible values in this [enum][AssetProvenance].
  static const values = <AssetProvenance>[
    cameraOriginal,
    scannerOriginal,
    unknown,
    cameraDerived,
    screenshot,
    generated,
  ];

  static AssetProvenance? fromJson(dynamic value) => AssetProvenanceTypeTransformer().decode(value);

  static List<AssetProvenance> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetProvenance>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetProvenance.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetProvenance] to String,
/// and [decode] dynamic data back to [AssetProvenance].
class AssetProvenanceTypeTransformer {
  factory AssetProvenanceTypeTransformer() => _instance ??= const AssetProvenanceTypeTransformer._();

  const AssetProvenanceTypeTransformer._();

  String encode(AssetProvenance data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetProvenance.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetProvenance? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'camera-original': return AssetProvenance.cameraOriginal;
        case r'scanner-original': return AssetProvenance.scannerOriginal;
        case r'unknown': return AssetProvenance.unknown;
        case r'camera-derived': return AssetProvenance.cameraDerived;
        case r'screenshot': return AssetProvenance.screenshot;
        case r'generated': return AssetProvenance.generated;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetProvenanceTypeTransformer] instance.
  static AssetProvenanceTypeTransformer? _instance;
}

