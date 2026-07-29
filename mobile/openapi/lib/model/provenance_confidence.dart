//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Confidence in an asset provenance classification
class ProvenanceConfidence {
  /// Instantiate a new enum with the provided [value].
  const ProvenanceConfidence._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const high = ProvenanceConfidence._(r'high');
  static const medium = ProvenanceConfidence._(r'medium');
  static const low = ProvenanceConfidence._(r'low');

  /// List of all possible values in this [enum][ProvenanceConfidence].
  static const values = <ProvenanceConfidence>[
    high,
    medium,
    low,
  ];

  static ProvenanceConfidence? fromJson(dynamic value) => ProvenanceConfidenceTypeTransformer().decode(value);

  static List<ProvenanceConfidence> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProvenanceConfidence>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProvenanceConfidence.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProvenanceConfidence] to String,
/// and [decode] dynamic data back to [ProvenanceConfidence].
class ProvenanceConfidenceTypeTransformer {
  factory ProvenanceConfidenceTypeTransformer() => _instance ??= const ProvenanceConfidenceTypeTransformer._();

  const ProvenanceConfidenceTypeTransformer._();

  String encode(ProvenanceConfidence data) => data.value;

  /// Decodes a [dynamic value][data] to a ProvenanceConfidence.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProvenanceConfidence? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'high': return ProvenanceConfidence.high;
        case r'medium': return ProvenanceConfidence.medium;
        case r'low': return ProvenanceConfidence.low;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ProvenanceConfidenceTypeTransformer] instance.
  static ProvenanceConfidenceTypeTransformer? _instance;
}

